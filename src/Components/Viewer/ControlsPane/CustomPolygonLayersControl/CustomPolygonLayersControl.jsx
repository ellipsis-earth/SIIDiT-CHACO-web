import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';
import L from 'leaflet';

import {
  Card,
  Checkbox,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Typography
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import './CustomPolygonLayersControl.css';

import ApiManager from '../../../../ApiManager';

const MAX_CUSTOM_POLYGONS = 500;

class CustomPolygonLayersControl extends PureComponent {

  layerGeoJsons = {};

  constructor(props, context) {
    super(props, context);

    this.state = {
      availableLayers: [],
      selectedLayers: [],

      options: [],

      expanded: true,

      count: {}
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
        availableLayers = this.getAvailableLayers(this.props.map);
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

  selectLayer = (layer) => {
    let availableLayer = this.state.availableLayers.find(x => x.name === layer);
    if (availableLayer && !this.state.selectedLayers.find(x => x.name === layer)) {
      this.setState({ selectedLayers: [...this.state.selectedLayers, availableLayer] });
    }
  }

  getAvailableLayers = (map) => {
    let availableLayers = [];

    for (let i = 0; i < map.layers.customPolygon.length; i++) {

      let layer = map.layers.customPolygon[i];

      let availableLayer = availableLayers.find(x => x.name === layer.name);

      if (!availableLayer) {
        availableLayers.push({
          name: layer.name,
          color: layer.color
        });
      }
    }

    return availableLayers;
  }

  createLayerCheckboxes = () => {
    let options = [];

    let availableLayers = this.state.availableLayers;
    let selectedLayers = this.state.selectedLayers;

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer) ? true : false;

      let counter = null;
      let c = this.state.count;
      let count = this.state.count[availableLayer.name];
      if (checked && count !== undefined) {
        let className = '';
        let downloadButton = null;

        if (count > MAX_CUSTOM_POLYGONS) {
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

        counter = (
          <span className='geometry-counter'>
            <span className={className}>{count}</span>
            <span>/{MAX_CUSTOM_POLYGONS}</span>
            {downloadButton}
          </span>
        )
      }

      let option = (
        <div key={availableLayer.name} className='layer-checkboxes'>
          <Checkbox
            key={availableLayer.name}
            classes={{ root: 'layers-control-checkbox' }}
            color='primary'
            value={availableLayer.name}
            name={availableLayer.name}
            onChange={this.onLayerChange}
            checked={checked}
          />
          <span>
            {availableLayer.name}
          </span>
          {counter}
        </div>
      )

      options.push(option);
    }

    return options;
  }

  refresh = () => {
    this.prepareLayers(
      this.props.map, this.props.timestampRange, this.state.availableLayers, this.state.selectedLayers
    )
      .then(leafletLayers => {
        this.props.onLayersChange(leafletLayers);
      });
  }

  prepareLayers = async (map, timestampRange, availableLayers, selectedLayers) => {
    let promises = [];

    for (let i = 0; i < availableLayers.length; i++) {

      let customPolygonLayer = availableLayers[i]

      if (!selectedLayers.find(x => x.name === customPolygonLayer.name)) {
        continue;
      }

      let bounds = this.props.leafletMapViewport.bounds;

      let body = {
        mapId: map.id,
        timestamp: map.timestamps[timestampRange.end].timestampNumber,
        layer: customPolygonLayer.name,
        xMin: bounds.xMin,
        xMax: bounds.xMax,
        yMin: bounds.yMin,
        yMax: bounds.yMax,
        zoom: map.zoom,
        limit: MAX_CUSTOM_POLYGONS
      };

      let leafletGeojsonLayerPromise = ApiManager.post('/geoMessage/customPolygon/ids', body, this.props.user)
        .then(customPolygonIds => {
          let count = {
            ...this.state.count,
          };
          count[customPolygonLayer.name] = customPolygonIds.count;

          this.setState({ count: count });

          if (!customPolygonIds || customPolygonIds.count === 0 || customPolygonIds.count > MAX_CUSTOM_POLYGONS) {
            this.layerGeoJsons[customPolygonLayer.name] = null;
            return null;
          }

          body = {
            mapId: map.id,
            timestamp: map.timestamps[timestampRange.end].timestampNumber,
            customPolygonIds: customPolygonIds.ids
          }

          return ApiManager.post('/geoMessage/customPolygon/geometries', body, this.props.user);
        })
        .then(customPolygonsGeoJson => {
          if (!customPolygonsGeoJson) {
            this.layerGeoJsons[customPolygonLayer.name] = null;
            return null;
          }

          this.layerGeoJsons[customPolygonLayer.name] = {
            geoJson: customPolygonsGeoJson,
            bounds: bounds
          };

          return (
            <GeoJSON
              key={Math.random()}
              data={customPolygonsGeoJson}
              style={ViewerUtility.createGeoJsonLayerStyle(`#${customPolygonLayer.color}`)}
              zIndex={ViewerUtility.customPolygonLayerZIndex + i}
              onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature) })}
            />
          );
        });

      promises.push(leafletGeojsonLayerPromise);
    }

    let leafletGeoJsonLayers = await Promise.all(promises);

    return leafletGeoJsonLayers;
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
      this.setState({ selectedLayers: newSelectedLayers });

      this.prepareLayers(this.props.map, this.props.timestampRange, this.state.availableLayers, newSelectedLayers)
        .then(standardTilesLayers => {
          this.props.onLayersChange(standardTilesLayers);
        });
    }
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onFeatureClick = (feature) => {
    this.props.onFeatureClick(feature);
  }

  onDownload = (layerName) => {
    let data = this.layerGeoJsons[layerName];

    if (!data) {
      return;
    }

    let bounds = data.bounds;

    let decimals = 4;

    let nameComponents = [
      this.props.map.name,
      'customPolygons',
      layerName,
      bounds.xMin.toFixed(decimals),
      bounds.xMax.toFixed(decimals),
      bounds.yMin.toFixed(decimals),
      bounds.yMax.toFixed(decimals)
    ];

    let fileName = nameComponents.join('_').replace(' ', '_') + '.geojson';

    ViewerUtility.download(fileName, JSON.stringify(data.geoJson), 'application/json');
  }

  render() {

    if (!this.props.map || this.state.availableLayers.length === 0) {
      return null;
    }

    return (
      <Card className='layers-contol'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {this.props.localization['Custom polygons']}
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
            {
              !this.props.override ?
                this.createLayerCheckboxes() :
                <div className='controls-pane-background-text'>Controlled by feed</div>
            }
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default CustomPolygonLayersControl;
