import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Collapse from '@material-ui/core/Collapse';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import IconButton from '@material-ui/core/IconButton';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import './FilterControl.css';

import ApiManager from '../../../../ApiManager';

const WMS_TILE_DISPLAY_NAME = 'correction mode';
const WMS_TILE_LAYER = {
	type: WMS_TILE_DISPLAY_NAME,
	name: WMS_TILE_DISPLAY_NAME
};

const MAX_TILES = 3000;

class FilterControl extends PureComponent {
	constructor(props, context) {
		super(props, context);

		this.state = {
			availableLayers: [],
			selectedLayers: [],
			geoJsonInfo: [],

			options: [],

			loading: false,
			filter: false,
			filterOption: 'allAnnotated',
			userFilter: '',
			filterIds: [],
			userError: '',

			expanded: true,
		};
	}

	componentDidMount() {
		this.props.onLayersChange([]);
	}

	componentDidUpdate(prevProps) {
		if (!this.props.map || !this.props.timestampRange) {
			this.props.onLayersChange([]);
			return;
		}

		let differentMap = this.props.map !== prevProps.map;

		let differentTimestamp = !prevProps.timestampRange ||
			this.props.timestampRange.start !== prevProps.timestampRange.start ||
			this.props.timestampRange.end !== prevProps.timestampRange.end;

		let differentBounds = !prevProps.leafletMapViewport ||
			this.props.leafletMapViewport.bounds.xMin !== prevProps.leafletMapViewport.bounds.xMin ||
			this.props.leafletMapViewport.bounds.xMax !== prevProps.leafletMapViewport.bounds.xMax ||
			this.props.leafletMapViewport.bounds.yMin !== prevProps.leafletMapViewport.bounds.yMin ||
			this.props.leafletMapViewport.bounds.yMax !== prevProps.leafletMapViewport.bounds.yMax;

		if (differentMap || differentTimestamp || differentBounds) {

			let availableLayers = this.state.availableLayers;
			let selectedLayers = this.state.selectedLayers;

			if (differentMap) {
				availableLayers = [WMS_TILE_LAYER];
				selectedLayers = [];

				this.setState({
					availableLayers: availableLayers,
					selectedLayers: selectedLayers,
					loading: false,
					filter: false,
					filterOption: 'allAnnotated',
					userFilter: '',
					filterIds: [],
					userError: '',
				});
			}

			if(this.state.filter)
			{
				this.getFilterIds();
			}
			else
			{
				this.prepareLayers(this.props.map, this.props.timestampRange, selectedLayers);
			}

		}
	}

	createLayerCheckboxes = () => {
		let options = [];

		let availableLayers = this.state.availableLayers;
		let selectedLayers = this.state.selectedLayers;

		for (let i = 0; i < availableLayers.length; i++) {

			let availableLayer = availableLayers[i];
			let checked = selectedLayers.find(x => x === availableLayer) ? true : false;
			let layerGeoJsonInfo = this.state.geoJsonInfo.find(x => x.name === availableLayer.name);

			let counter = null;
			if (checked && layerGeoJsonInfo) {
				let className = '';
				let downloadButton = null;

				if (layerGeoJsonInfo.count > MAX_TILES) {
					className = 'geometry-limit-exceeded';
				}
				else {
					downloadButton = (
						<IconButton
							className='download-geometry-button'
							onClick={() => this.onDownload(availableLayer.name)}
						>
							<SaveAlt className='download-geometry-button-icon'/>
						</IconButton>
					);
				}

				let checkboxLabel = (
					<span>
						<span className={className}>{layerGeoJsonInfo.count}</span>
						<span>/{MAX_TILES}</span>
					</span>
				);

				if (availableLayer === WMS_TILE_LAYER && layerGeoJsonInfo.count > MAX_TILES) {
					checkboxLabel = <span className={className}>{layerGeoJsonInfo.count + '/' + MAX_TILES}</span>
				}

				counter = (
					<span className='geometry-counter' key={'counter_' + layerGeoJsonInfo.count}>
						{checkboxLabel}
						{downloadButton}
					</span>
				);
			}

			let option = (
				<div key={availableLayer.name} className='layer-checkboxes'>
					<FormControlLabel
						margin='dense'
						disabled={this.state.loading}
						control={
							<Checkbox
								key={availableLayer.name}
								color='primary'
								value={availableLayer.name}
								name={availableLayer.name}
								onChange={this.onLayerChange}
								checked={checked}
							/>
						}
						label={this.state.loading ? [<span key={availableLayer.name}>{availableLayer.name}</span>, <br key='break'/>, <CircularProgress size={12} key={availableLayer.name + '_spinner'} className='filterLoadingSpinner'/> ,counter] : [<span key={availableLayer.name}>{availableLayer.name}</span>, <br key='break'/>, counter]}
					/>
				</div>
			)

			options.push(option);
		}

		options.push(this.createFilterOptions());

		return options;
	}

	createFilterOptions = () => {
		let options = [];

		/*options.push(
			<FormControlLabel
				margin='dense'
				value="noFilter"
				key="noFilter"
				control={<Radio color='primary' key='noFilterRadio'/>}
				label="No Filter"
				className='filterRadio'
				disabled={!this.state.filter}
			/>
		);*/

		options.push(
			<FormControlLabel
				margin='dense'
				value="allAnnotated"
				key="allAnnotated"
				control={<Radio color='primary' key='allAnnotatedRadio'/>}
				label="All annotated tiles"
				className='filterRadio'
				disabled={!this.state.filter || this.state.loading}
			/>
		);

		options.push([
			<FormControlLabel
				margin='dense'
				value="name"
				key="name"
				control={<Radio color='primary' key='nameRadio'/>}
				label="Annotated by specified user"
				className='filterRadio'
				disabled={!this.state.filter || this.state.loading}
			/>,
			<Collapse
				key='nameFilterCollapse'
				in={this.state.filter && this.state.filterOption === 'name'}
			>
				<TextField
					label='username'
					onChange={this.handleUsernameChange}
					key='nameInput'
					disabled={!this.state.filter || this.state.loading}
					className='filterNameInput'
					margin='none'
					error={this.state.userError.length > 0}
					helperText={this.state.userError.length > 0 ? this.state.userError : null}
				/>
				<Button
					key={'submit' + this.state.loading}
					disabled={this.state.loading || !this.state.filter}
					variant='contained'
					color='primary'
					onClick={this.getFilterIds}
					startIcon={this.state.loading ? <CircularProgress size={20} /> : null}
					className='filterButton'
				>
					Filter
				</Button>
			</Collapse>]
		);

		options.push(
			<FormControlLabel
				margin='dense'
				value="approved"
				key="approved"
				control={<Radio color='primary' key='approvedRadio'/>}
				label="All approved tiles"
				className='filterRadio'
				disabled={!this.state.filter || this.state.loading}
			/>
		);

		return(<FormControl component="fieldset" key='filterControl'>
			<FormControlLabel
				margin='dense'
				control={
					<Checkbox
						key='filter'
						color='primary'
						value='filter'
						name='filter'
						onChange={this.onFilterChange}
						checked={this.state.filter}
						disabled={this.state.loading}
					/>
				}
				label='Filter'
				className='filterHeader'
			/>
			<Collapse in={this.state.filter}>
				<RadioGroup
					aria-label="filter"
					name="filter"
					value={this.state.filterOption}
					onChange={this.handleRadioChange}
					key={'filterRadioGroup_' + this.state.filter}
					className='filterRadio'
				>
					{options}
				</RadioGroup>
			</Collapse>
		</FormControl>);
	}

	handleRadioChange = (e) => {
		this.setState({loading: true, filterOption: e.target.value}, this.getFilterIds)
	}

	onFilterChange = (e) => {
		this.onLayerChange({target: {value: WMS_TILE_DISPLAY_NAME, checked: e.target.checked}});
		this.setState({filter: e.target.checked, loading: true}, this.getFilterIds)
	}

	handleUsernameChange = (e) => {
		this.setState({userFilter: e.target.value, error: ''})
	}

	getFilterIds = async () => {
		if(this.state.filter)
		{
			let body = {
				mapId: this.props.map.id,
				timestamp: this.props.timestampRange.end,
				bounds: this.props.leafletMapViewport.bounds,
			};

			if (this.state.filterOption === 'name' && this.state.userFilter.length > 0)
			{
				body.user = this.state.userFilter.toLowerCase();
			}
			else if (this.state.filterOption === 'approved')
			{
				body.checked = true;
			}

			ApiManager.post('/raster/ids', body, this.props.user, 'v2')
			.then(async filterIds => {
				this.setState({filterIds: filterIds.ids,  error: ''}, () => {this.prepareLayers(this.props.map, this.props.timestampRange, this.state.selectedLayers)});
			})
			.catch(error => {
				if (this.state.filterOption === 'name' && error.message.includes('No user'))
				{
					console.log(error);
					this.setState({userError: error.message, loading: false})
				}
				else
				{
					console.error(error);
				}
			});
		}
	}

	prepareLayers = (map, timestampRange, selectedLayers) => {
		let promises = [];

		if (selectedLayers.includes(WMS_TILE_LAYER)) {
			promises.push(this.prepareWmsTileLayer(map));
		}

		Promise.all(promises)
			.then(results => {
				let leafletElements = results.map(x => x.geoJsonElement);
				this.props.onLayersChange(leafletElements);
				this.setState({ geoJsonInfo: results, loading: false});
			});
	}

	prepareWmsTileLayer = async (map) => {
		let bounds = this.props.leafletMapViewport.bounds;
		let zoom = map.zoom;

		let tileBounds = calculateTileBounds(bounds, zoom);

		let result = {
			name: WMS_TILE_DISPLAY_NAME,
			count: tileBounds.count,
			bounds: bounds,
			geoJson: null,
			geoJsonElement: null
		};

		if (result.count > MAX_TILES && !this.state.filter) {
			return result;
		}

		result.geoJson = this.tileBoundsToGeoJson(tileBounds, zoom);
		result.count = result.geoJson.count;

		if (result.count > MAX_TILES) {
			return result;
		}

		result.geoJsonElement = (
			<GeoJSON
				key={Math.random()}
				data={result.geoJson}
				style={ViewerUtility.createGeoJsonLayerStyle('orange')}
				zIndex={ViewerUtility.standardTileLayerZIndex + 1}
				onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature) })}
			/>
		);

		return result;
	}

	onLayerChange = (e) => {
		let layerName = e.target.value;
		let checked = e.target.checked;

		let isSelected = this.state.selectedLayers.find(x => x.name === layerName);

		let newSelectedLayers = null;
		let changed = false;

		if (checked && !isSelected) {
			let availableLayer = this.state.availableLayers.find(x => x.name === layerName);

			newSelectedLayers = [...this.state.selectedLayers, availableLayer];

			changed = true;
		}
		else if (!checked && isSelected) {
			newSelectedLayers = Utility.arrayRemove(this.state.selectedLayers, isSelected);

			newSelectedLayers = [...newSelectedLayers];

			changed = true;
		}

		if (changed) {
			let stateObj = {selectedLayers: newSelectedLayers, loading: true}
			if (!checked && isSelected)
			{
				stateObj.filter = false;
			}

			this.setState(stateObj);
			this.prepareLayers(this.props.map, this.props.timestampRange, newSelectedLayers);
		}
	}

	onExpandClick = () => {
		this.setState({ expanded: !this.state.expanded });
	}

	onFeatureClick = (feature) => {
		this.props.onFeatureClick(feature);
	}

	onDownload = (layerName) => {
		let layerGeoJsonInfo = this.state.geoJsonInfo.find(x => x.name === layerName);

		if (!layerGeoJsonInfo) {
			return;
		}

		let bounds = layerGeoJsonInfo.bounds;

		let decimals = 4;

		let nameComponents = [
			this.props.map.name,
			'tiles',
			bounds.xMin.toFixed(decimals),
			bounds.xMax.toFixed(decimals),
			bounds.yMin.toFixed(decimals),
			bounds.yMax.toFixed(decimals)
		];

		let fileName = nameComponents.join('_') + '.kml';

		ViewerUtility.download(fileName, JSON.stringify(layerGeoJsonInfo.geoJson), 'application/vnd.google-earth.kml+xml');
	}

	tileBoundsToGeoJson = (tileBounds, zoom) => {
		let result = {
			type: 'FeatureCollection',
			count: this.state.filter ? this.state.filterIds.length : tileBounds.count,
			features: []
		};

		for (let tileY = tileBounds.tileYMin; tileY < tileBounds.tileYMax; tileY++) {
			for (let tileX = tileBounds.tileXMin; tileX < tileBounds.tileXMax; tileX++) {
				let tile = {
					tileX: tileX,
					tileY: tileY,
					zoom: zoom
				};

				let filter = false;

				for (let i = 0; i < this.state.filterIds.length; i++)
				{
					if (tileX === this.state.filterIds[i].tileX && tileY === this.state.filterIds[i].tileY && zoom === this.state.filterIds[i].zoom)
					{
						filter = true;
					}
				}

				if ((this.state.filter && filter) || !this.state.filter)
				{
					let tileCoord = calculateTileCoords(tile, zoom);

					let coords = [[
						[tileCoord.xMin, tileCoord.yMin],
						[tileCoord.xMax, tileCoord.yMin],
						[tileCoord.xMax, tileCoord.yMax],
						[tileCoord.xMin, tileCoord.yMax],
						[tileCoord.xMin, tileCoord.yMin]
					]];

					let feature = {
						id: result.features.length,
						type: "Feature",
						properties: {
							type: ViewerUtility.wmsTileLayerType,
							tileX: tile.tileX,
							tileY: tile.tileY,
							zoom: tile.zoom
						},
						geometry: {
							type: 'Polygon',
							coordinates: coords
						}
					};

					result.features.push(feature);
				}
			}
		}

		return result;
	}

	render() {
		/*let mobile = false;
		try{ document.createEvent("TouchEvent"); mobile = true; }
  	catch(e){ mobile = false }*/

		if (!this.props.map || this.state.availableLayers.length === 0 || this.props.map.accessLevel < 515 ) {
			return null;
		}

		return (
			<Card className='layers-control filter-control'>
				<CardHeader
					className='material-card-header'
					title={
						<Typography gutterBottom variant="h6" component="h2">
							Correction Mode
						</Typography>
					}
					action={
						<IconButton
							className={this.state.expanded ? 'expand-icon expanded' : 'expand-icon'}
							onClick={this.onExpandClick}
							aria-expanded={this.state.expanded}
							aria-label='Show'
						>
							<ExpandMoreIcon />
						</IconButton>
					}
				/>
				<Collapse in={this.state.expanded}>
					<CardContent
						className={'card-content'}
					>
						{ this.createLayerCheckboxes() }
					</CardContent>
				</Collapse>
			</Card>
		);
	}
}

function calculateTileBounds(bounds, zoom) {
	let pi = Math.PI;
	let zoomComp = Math.pow(2, zoom);

	let comp1 = zoomComp / 360;
	let comp2 = 2 * pi;
	let comp3 = pi / 4;

	let tileXMin = Math.floor((bounds.xMin + 180) * comp1);
	let tileYMin = Math.floor(zoomComp / comp2 * (pi - Math.log(Math.tan(comp3 + bounds.yMax / 360 * pi))));

	let tileXMax = Math.floor((bounds.xMax + 180 ) * comp1 + 1);
	let tileYMax = Math.floor(zoomComp / comp2 * (pi - Math.log(Math.tan(comp3 + bounds.yMin / 360 * pi))) + 1);

	return {
		tileXMin: tileXMin,
		tileYMin: tileYMin,

		tileXMax: tileXMax,
		tileYMax: tileYMax,
		count: (tileXMax - tileXMin) * (tileYMax - tileYMin)
	};
}


const comp1 = (360 / (2 * Math.PI));
const comp3 = Math.PI / 2;

function calculateTileCoords(tile) {
	let pi = Math.PI;

	let tileX = tile.tileX;
	let tileY = tile.tileY;
	let zoom = tile.zoom;

	let comp2 = Math.pow(2, zoom);

	let xMin = ((tileX * 360) / comp2) - 180;
	let xMax = ((tileX + 1) * 360 / comp2) - 180;
	let yMin = comp1 * (2 * (Math.atan(Math.exp(-2 * (pi * (tileY + 1)) / comp2 + pi))) - comp3);
	let yMax = comp1 * (2 * (Math.atan(Math.exp(-2 * (pi * tileY) / comp2 + pi))) - comp3);

	return {
		xMin: xMin,
		xMax: xMax,
		yMin: yMin,
		yMax: yMax
	};
}

export default FilterControl;