import React, { Component } from 'react';
/*import { renderToStaticMarkup } from 'react-dom/server';*/
import { GeoJSON } from 'react-leaflet';
import L/*, {divIcon}*/ from 'leaflet';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import Collapse from '@material-ui/core/Collapse';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Typography from '@material-ui/core/Typography';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
/*import RoomIcon from '@material-ui/icons/RoomTwoTone';*/
import SaveAlt from '@material-ui/icons/SaveAlt';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilter } from '@fortawesome/free-solid-svg-icons'

import LayerInfoButton from './LayerUtilities/LayerInfo/LayerInfo';
import PolygonLayerFilterPane from './LayerUtilities/PolygonLayerFilterPane/PolygonLayerFilterPane';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import './PolygonLayersControl.css';

import ApiManager from '../../../../ApiManager';

const MAX_POLYGONS = 1000;

class PolygonLayersControl extends Component {

  layerGeoJsons = {}

  constructor(props, context) {
    super(props, context);

    this.state = {
      availableLayers: [],
      selectedLayers: [],

      loading: false,
      layerLoading: [],

      options: [],

      expanded: true,

      count: {},

      filterLayers: [],
      filters: [],
    };

    this.filterDetectada = ["b4cfa212-9547-4d43-9119-1db5482954a3", "647c9802-f136-4029-aa6d-884396be4e9b", "88c50f4c-0582-4c12-9b16-a8ca6bc01616"];
    this.filterInformation = ["bfe00499-c9f4-423f-b4c6-9adfd4e91d1e", "963c2e9f-068a-4213-8cb7-cf336c57d40e", "7373e49b-dae5-48e0-b937-7ee07a9d5cb2", "e56e3079-a0e1-4e44-8aef-219dde0cb850", "e3fa7c52-f02c-4977-bdd9-33b250da9b33", "5410fdcd-6b17-414c-8be3-c973db5bd0f9", "e99121e1-9d6e-4bfb-94b6-0b8ca1492ff3", "5e45ea5c-1f1c-47bf-9309-12316200cf61"];
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
        availableLayers = this.props.map.layers.polygon;
        selectedLayers = [];
        this.layerGeoJsons = {};

        this.setState({
          availableLayers: availableLayers,
          selectedLayers: selectedLayers,
          count: {}
        });
      }

      this.prepareLayers(this.props.map, this.props.timestampRange, availableLayers, selectedLayers)
        .then(leafletLayers => {
          this.props.onLayersChange(leafletLayers);
        });
    }
  }

  filter = (filter) => {
    let filters = this.state.filters;

    let appliedFilter = filters.find((x) => x.id === filters.id)
    if (typeof appliedFilter !== 'undefined')
    {
      filters.filter = filter.filter;
    }
    else
    {
      filters.push(filter);
    }

    this.setState({filters: filters}, () => {
      this.prepareLayers(
        this.props.map, this.props.timestampRange, this.state.availableLayers, this.state.selectedLayers
      )
      .then(leafletLayers => {
        this.props.onLayersChange(leafletLayers);
      });
    });
  }

  refresh = () => {
    this.prepareLayers(
      this.props.map, this.props.timestampRange, this.state.availableLayers, this.state.selectedLayers
    )
      .then(leafletLayers => {
        this.props.onLayersChange(leafletLayers);
      });
  }

  selectLayer = (layer) => {
    let availableLayer = this.state.availableLayers.find(x => x.name === layer);
    if (availableLayer && !this.state.selectedLayers.find(x => x.name === layer)) {
      this.setState({ selectedLayers: [...this.state.selectedLayers, availableLayer] });
    }
  }

  changeFilterLayers = (layerName, override = false) => {
    let filterLayers = this.state.filterLayers;

    let index = filterLayers.indexOf(layerName);

    if(index > -1)
    {
      filterLayers.splice(index, 1);
    }
    else if(override)
    {
      filterLayers.push(layerName);
    }

    this.setState({filterLayers: filterLayers}, () => {
      this.prepareLayers(this.props.map, this.props.timestampRange, this.state.availableLayers, this.state.selectedLayers)
      .then(leafletLayers => {
        this.props.onLayersChange(leafletLayers);
      });
    })
  }

  changeLayerLoading = (layerName) => {
    let layerLoading = this.state.layerLoading;

    let index = layerLoading.indexOf(layerName);

    if(index > -1)
    {
      layerLoading.splice(index, 1);
    }
    else
    {
      layerLoading.push(layerName);
    }

    this.setState({layerLoading: layerLoading})
  }

  createLayerCheckboxes = () => {
    let options = [
      [<ListSubheader color='primary' key='Celdas con cambios detectados'>Celdas con cambios detectados</ListSubheader>, []],
      [<ListSubheader color='primary' key='Capas de Cambio de Uso del Suelo'>Capas de Cambio de Uso del Suelo</ListSubheader>, []],
      [<ListSubheader color='primary' key='Capas de Información'>Capas de Información</ListSubheader>, []],
    ];

    let availableLayers = this.state.availableLayers;
    let selectedLayers = this.state.selectedLayers;

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer) ? true : false;

      let counter = null;
      let count = this.state.count[availableLayer.name];

        let downloadButton = (
          <IconButton
            onClick={() => {this.setState({loading: true}, () => this.onDownload(availableLayer.name))}}
            disabled={this.state.loading}
            key={availableLayer.name + '_download_' + this.state.loading}
            edge="end"
          >
            {this.state.loading? <CircularProgress size={18} /> : <SaveAlt fontSize="small"/>}
          </IconButton>
        );

        let filterOpen = this.state.filterLayers.includes(availableLayer.name);

        let filterButton = null;

        if (availableLayer.properties && availableLayer.properties.length > 0 && this.filterInformation.includes(availableLayer.id))
        {
          filterButton = this.state.loading ? <CircularProgress size={18} /> : <FontAwesomeIcon icon={faFilter} />
        }

      counter = (
       <List dense component="div" disablePadding className='counter'>
        <ListItem key={availableLayer.name + '_counter_' + count}>
          {filterButton ? <ListItemIcon>
            <IconButton
              edge="start"
              onClick={() => {this.changeFilterLayers(availableLayer.name, true)}}
              /*disabled={this.state.loading}*/
              key={availableLayer.name + '_filter_' + this.state.loading}
              color={filterOpen ? 'primary' : 'default'}
            >
              {filterButton}
            </IconButton>
          </ListItemIcon> : null}
           <ListItemText className={filterButton ? 'counterText withButton' : 'counterText'} primary={<div className='counterContainer'>
                <span className={count > MAX_POLYGONS ? 'geometry-limit-exceeded' : ''}>{count}</span>
                <span>/{MAX_POLYGONS}</span>
              </div>}
            />
           <ListItemSecondaryAction>{downloadButton}</ListItemSecondaryAction>
        </ListItem>
        <ListItem key={availableLayer.name + '_filter'}>
          <PolygonLayerFilterPane
            filterOpen={filterOpen}
            layer={availableLayer}
            filter={this.filter}
          />
        </ListItem>
      </List>)

      const labelId = `checkbox-list-label-${availableLayer.name}`;

      let option = ([
        <ListItem color='primary' button dense key={availableLayer.name + '_item_' + checked} onClick={()=>{this.onLayerChange({target: {value: availableLayer.name, checked: !checked}})}}>
          <ListItemIcon>
            {
              this.state.layerLoading.includes(availableLayer.name) ? <CircularProgress size={24} /> :
              <Checkbox
                key={availableLayer.name + '_' + checked}
                edge="start"
                color='primary'
                value={availableLayer.name}
                name={availableLayer.name}
                checked={checked}
                disableRipple
                tabIndex={-1}
                inputProps={{ 'aria-labelledby': labelId }}
              />
            }
          </ListItemIcon>
          <ListItemText
            id={labelId}
            primary={availableLayer.name}
          />
          <ListItemSecondaryAction>
            <LayerInfoButton key={'LayerInfo_' + availableLayer.name} id={availableLayer.id} setLayerInfoContent={this.props.setLayerInfoContent}/>
          </ListItemSecondaryAction>
        </ListItem>,
        <Collapse key={availableLayer.name + '_collapse'} in={checked && count !== undefined}>
          {counter}
        </Collapse>]
      )

      if (this.filterInformation.includes(availableLayer.id))
      {
        options[2][1].push(option)
      }
      else if (this.filterDetectada.includes(availableLayer.id))
      {
        options[0][1].push(option)
      }
      else
      {
        options[1][1].push(option)
      }
    }

    if (this.props.map.accessLevel >= 550)
    {
      return options;
    }
    else
    {
      delete options[0];
      return options;
    }
  }

  getDownloadData = async (map) => {

  }

  prepareLayers = async (map, timestampRange, availableLayers, selectedLayers) => {
    let promises = [];

    for (let i = 0; i < availableLayers.length; i++) {
      let polygonLayer = availableLayers[i];

      if (!selectedLayers.find(x => x.name === polygonLayer.name)) {
        continue;
      }

      let selectLayer = polygonLayer;

      let bounds = this.props.leafletMapViewport.bounds;

      let body = {
        mapId: map.id,
        type: ViewerUtility.polygonLayerType,
        layer: selectLayer.name,
        xMin: bounds.xMin,
        xMax: bounds.xMax,
        yMin: bounds.yMin,
        yMax: bounds.yMax,
        limit: MAX_POLYGONS,
      };

      let filter = [];

      if(selectLayer.id === 'c8511879-1551-4e2c-b03d-7e9c9d3272c9')
      {
        if (timestampRange.end === timestampRange.start)
        {
          filter.push({key: 'timestamp', value: timestampRange.end, operator: '='})
        }
        else
        {
          filter.push({key: 'timestamp', value: timestampRange.start, operator: '>='});
          filter.push({key: 'timestamp', value: timestampRange.end, operator: '<='});
        }
      }

      let filters = this.state.filters.find(x => polygonLayer.id === x.id);

      if(typeof filters !== 'undefined' && this.state.filterLayers.includes(polygonLayer.name))
      {
        for (let j = 0; j < filters.filter.length; j++)
        {
          filter.push(filters.filter[j]);
        }
      }

      console.log(filter, filters);

      if (filter.length > 0)
      {
        body.filters = filter;
      }

      let leafletGeojsonLayerPromise = await ApiManager.post('/geometry/ids', body, this.props.user, 'v2')
        .then(polygonIds => {
          let count = {
            ...this.state.count,
          };
          count[selectLayer.name] = polygonIds.count;

          this.setState({ count: count });

          if (!polygonIds || polygonIds.count === 0 || polygonIds.count > MAX_POLYGONS) {
            this.layerGeoJsons[selectLayer.name] = null;
            return null;
          }

          body = {
            mapId: map.id,
            type: ViewerUtility.polygonLayerType,
            elementIds: polygonIds.ids
          };

          return ApiManager.post('/geometry/get', body, this.props.user, 'v2');
        })
        .then(polygonsGeoJson => {
          if (!polygonsGeoJson) {
            this.layerGeoJsons[selectLayer.name] = null;
            return null;
          }

          this.layerGeoJsons[selectLayer.name] = {
            geoJson: polygonsGeoJson,
            bounds: bounds
          };

          let icon = ViewerUtility.returnMarker(`#${selectLayer.color}`, this.props.markerSize, 'RoomTwoTone')


          let linesCollection = {
            type: 'FeatureCollection',
            count: 0,
            features: []
          };

          for (let i = polygonsGeoJson.features.length - 1; i >= 0; i--)
          {
            if (polygonsGeoJson.features[i] && polygonsGeoJson.features[i].geometry.type === 'LineString')
            {
              linesCollection.features.push(polygonsGeoJson.features[i]);
              linesCollection.count = linesCollection.count + 1;

              polygonsGeoJson.count = polygonsGeoJson.count - 1;
              polygonsGeoJson.features.splice(i,1);
            }
          }

          return (
            [<GeoJSON
              key={Math.random()}
              data={polygonsGeoJson}
              style={ViewerUtility.createGeoJsonLayerStyle(`#${selectLayer.color}`)}
              zIndex={ViewerUtility.polygonLayerZIndex + i}
              onEachFeature={(feature, layer) => {layer.on({ click: () => this.onFeatureClick(feature, selectLayer.hasAggregatedData) })}}
              pointToLayer={(geoJsonPoint, latlng) => this.markerReturn(latlng, icon)}
            />,
            <GeoJSON
              key={Math.random()}
              data={linesCollection}
              style={ViewerUtility.createGeoJsonLayerStyle(`#${selectLayer.color}`, 3)}
              zIndex={ViewerUtility.polygonLayerZIndex + i}
              onEachFeature={(feature, layer) => {layer.on({ click: () => this.onFeatureClick(feature, selectLayer.hasAggregatedData) })}}
            />
            ]
          );
        });

      promises.push(leafletGeojsonLayerPromise);
    }

    let leafletGeoJsonLayers = await Promise.all(promises);

    return leafletGeoJsonLayers;
  }

  changeWeight = (feature, layer) => {
    if (feature.geometry.type === 'LineString')
    {
      console.log(layer)
    }
  }

  markerReturn = (latlng, icon) => {
    return L.marker(latlng, {icon: icon, pane: 'overlayPane'});
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
      this.changeLayerLoading(e.target.value);
      this.changeFilterLayers(e.target.value);
      this.setState({ selectedLayers: newSelectedLayers });

      this.prepareLayers(this.props.map, this.props.timestampRange, this.state.availableLayers, newSelectedLayers)
        .then(standardTilesLayers => {
          this.props.onLayersChange(standardTilesLayers);
          this.setState({ layerLoading: [] });
        });
    }
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onFeatureClick = (feature, hasAggregatedData) => {
    this.props.onFeatureClick(feature, hasAggregatedData);
  }

  onDownload = async (layerName) => {
    let data = this.layerGeoJsons[layerName];

    if (!data) {
      let bounds = this.props.leafletMapViewport.bounds;

      let body = {
        mapId: this.props.map.id,
        type: ViewerUtility.polygonLayerType,
        layer: layerName,
        xMin: bounds.xMin,
        xMax: bounds.xMax,
        yMin: bounds.yMin,
        yMax: bounds.yMax,
      };

      let selectLayer = this.props.map.layers.polygon.find(x => x.name === layerName);

      if(selectLayer.id === 'c8511879-1551-4e2c-b03d-7e9c9d3272c9')
      {
        let filter = [];
        if (this.props.timestampRange.end === this.props.timestampRange.start)
        {
          filter.push({key: 'timestamp', value: this.props.timestampRange.end, operator: '='})
        }
        else
        {
          filter.push({key: 'timestamp', value: this.props.timestampRange.start, operator: '>='});
          filter.push({key: 'timestamp', value: this.props.timestampRange.end, operator: '<='});
        }

        body.filters = filter;
      }

      let leafletGeojsonLayerPromise = await ApiManager.post('/geometry/ids', body, this.props.user, 'v2')
      .then(polygonIds => {
        let geometryPromises = [];

        let body = {
          mapId: this.props.map.id,
          type: ViewerUtility.polygonLayerType,
        };

        let i,j,temparray,chunk = MAX_POLYGONS;
        for (i=0,j=polygonIds.ids.length; i<j; i+=chunk)
        {
          temparray = polygonIds.ids.slice(i,i+chunk);
          body.elementIds = temparray;

          geometryPromises.push(ApiManager.post('/geometry/get', body, this.props.user, 'v2'))
        }

        return Promise.all(geometryPromises);
      })
      .then(polygonsGeoJson => {
        let count = 0;
        let features = [];

        for (let i = 0; i < polygonsGeoJson.length; i++)
        {
          count = count + polygonsGeoJson[i].count;
          features = [...features, ...polygonsGeoJson[i].features];
        }

        let returnJson = {
          type: "FeatureCollection",
          count: count,
          features: features,
        };

        data = {bounds: bounds, geoJson: returnJson};
      });
    }

    let bounds = data.bounds;

    let decimals = 4;

    let nameComponents = [
      this.props.map.name,
      'polygons',
      layerName,
      bounds.xMin.toFixed(decimals),
      bounds.xMax.toFixed(decimals),
      bounds.yMin.toFixed(decimals),
      bounds.yMax.toFixed(decimals)
    ];

    let fileName = nameComponents.join('_').replace(' ', '_') + '.kml';

    ViewerUtility.download(fileName, JSON.stringify(data.geoJson), 'application/vnd.google-earth.kml+xml');
    this.setState({loading: false})
  }

  render() {

    if (!this.props.map || this.state.availableLayers.length === 0) {
      return null;
    }

    return (
      <Card className='layers-control'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {'Polygons'}
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
            <List dense className='polygonLayersList'>
              {
                !this.props.override ?
                  this.createLayerCheckboxes() :
                  <div className='controls-pane-background-text'>Controlled by feed</div>
              }
            </List>
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default PolygonLayersControl;
