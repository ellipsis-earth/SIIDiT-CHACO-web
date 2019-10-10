import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';

import {
  Card,
  Checkbox,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Typography,
  FormControlLabel
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import LayerInfoButton from './LayerInfo/LayerInfo';
import './PolygonLayersControl.css';

import ApiManager from '../../../../ApiManager';

const MAX_POLYGONS = 500;

class PolygonLayersControl extends PureComponent {

  layerGeoJsons = {}

  constructor(props, context) {
    super(props, context);

    this.state = {
      availableLayers: [],
      selectedLayers: [],

      options: [],

      expanded: true,

      count: {}
    };

    this.filterDetectada = ["b4cfa212-9547-4d43-9119-1db5482954a3", "647c9802-f136-4029-aa6d-884396be4e9b"];
    this.filterInformation = ["bfe00499-c9f4-423f-b4c6-9adfd4e91d1e", "963c2e9f-068a-4213-8cb7-cf336c57d40e", "7373e49b-dae5-48e0-b937-7ee07a9d5cb2", "e56e3079-a0e1-4e44-8aef-219dde0cb850", "e3fa7c52-f02c-4977-bdd9-33b250da9b33", "5410fdcd-6b17-414c-8be3-c973db5bd0f9", "e99121e1-9d6e-4bfb-94b6-0b8ca1492ff3", "5e45ea5c-1f1c-47bf-9309-12316200cf61"]

    this.filterProps = {
      "b4cfa212-9547-4d43-9119-1db5482954a3": {
        type: 'tile',
        formID: '5fd5ebe0-9d02-11e9-baf8-42010a840021',
      },
      "647c9802-f136-4029-aa6d-884396be4e9b" : {
        type: 'polygon',
        formID: '0ef01ab2-9d01-11e9-baf8-42010a840021',
      }
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

  createLayerCheckboxes = () => {
    let options = [
      [<h3 key='Capas Detectada'>Capas Detectada</h3>, []],
      [<h3 key='Capas de Deforestacion'>Capas de Deforestacion</h3>, []],
      [<h3 key='Capas de Información'>Capas de Información</h3>, []],
    ];

    let availableLayers = this.state.availableLayers;
    let selectedLayers = this.state.selectedLayers;

    for (let i = 0; i < availableLayers.length; i++)
    {
      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer) ? true : false;

      let counter = null;
      let count = this.state.count[availableLayer.name];
      if (checked && count !== undefined) {
        let className = '';
        let downloadButton = null;

        if (count > MAX_POLYGONS) {
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
            <span>/{MAX_POLYGONS}</span>
            {downloadButton}
          </span>
        )
      }

      let option = (
        <div key={availableLayer.name} className='layer-checkboxes'>
          <FormControlLabel
            control = {
              <Checkbox
                key={availableLayer.name}
                classes={{ root: 'layers-control-checkbox' }}
                color='primary'
                value={availableLayer.name}
                name={availableLayer.name}
                onChange={this.onLayerChange}
                checked={checked}
              /> }
            label={[
              <p className='layerLabel' key={availableLayer.name}>{availableLayer.name}</p>,
              <LayerInfoButton key={'LayerInfo_' + availableLayer.name} id={availableLayer.id} getLayerInfoContent={this.props.getLayerInfoContent}/>]}
          />
          {counter}
        </div>
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

    return options;
  }

  sortLayers = (availableLayers) => {
    let border = 2;

    availableLayers = JSON.parse(JSON.stringify(availableLayers));
    let filter = JSON.parse(JSON.stringify(availableLayers)).filter(x => !this.filterInformation.includes(x.id));

    availableLayers.sort((a,b) => {
      if (filter.includes(a.id) && filter.includes(b.id))
      {
        if (this.filterDetectada.includes(a.id) && this.filterDetectada.includes(b.id))
        {
          return 0;
        }
        else if(this.filterDetectada.includes(b.id))
        {
          return -1;
        }
        else if(this.filterDetectada.includes(a.id))
        {
          return 1;
        }
      }
      else if(filter.includes(b.id))
      {
        return -1;
      }
      else if(filter.includes(a.id))
      {
        return 1;
      }
    });

    return availableLayers;
  }

  getIds = (map, timestampRange, polygonLayer, bounds, filter) => {
    let body = {
      mapId: map.id,
      limit: MAX_POLYGONS
    };

    if (filter)
    {
      body.type = filter.type;
      body.filters = {
        forms: [map.forms.find(x => x.uuid === filter.formID).formName],
        bounds: {
          xMin: bounds.xMin,
          xMax: bounds.xMax,
          yMin: bounds.yMin,
          yMax: bounds.yMax,
        }
      }

      return ApiManager.post('/geoMessage/ids', body, this.props.user, 'v2')
    }
    else
    {
      body.timestamp = map.timestamps[timestampRange.end].timestampNumber;
      body.layer = polygonLayer.name;
      body.xMin = bounds.xMin;
      body.xMax = bounds.xMax;
      body.yMin = bounds.yMin;
      body.yMax = bounds.yMax;
      body.zoom = map.zoom;

      return ApiManager.post('/metadata/polygons', body, this.props.user)
    }

  }

  prepareLayers = async (map, timestampRange, availableLayers, selectedLayers) => {
    let promises = [];

    availableLayers = this.sortLayers(availableLayers);

    for (let i = 0; i < availableLayers.length; i++) {

      let polygonLayer = availableLayers[i]

      if (!selectedLayers.find(x => x.name === polygonLayer.name)) {
        continue;
      }

      let bounds = this.props.leafletMapViewport.bounds;

      let filter = null;
      let type = 'polygon';

      if (this.filterDetectada.includes(polygonLayer.id))
      {
        filter = this.filterProps[polygonLayer.id]
        type = filter.type;
      }

      let leafletGeojsonLayerPromise = this.getIds(map, timestampRange, polygonLayer, bounds, filter)
        .then(polygonIds => {
          let count = {
            ...this.state.count,
          };
          count[polygonLayer.name] = polygonIds.count;

          this.setState({ count: count });

          if (!polygonIds || polygonIds.count === 0 || polygonIds.count > MAX_POLYGONS) {
            this.layerGeoJsons[polygonLayer.name] = null;
            return null;
          }

          let body = {
            mapId: map.id,
            timestamp: map.timestamps[timestampRange.end].timestampNumber,
          }

          if (filter)
          {
            if (type === 'polygon')
            {
              body['polygonIds'] = polygonIds.messages.map(x => {return x.elementId})
            }
            else
            {
              body['tileIds'] = polygonIds.messages.map(x => {return x.elementId})
            }
          }
          else
          {
            body['polygonIds'] = polygonIds.ids
          }

          return ApiManager.post(('/geometry/' + type + 's'), body, this.props.user);
        })
        .then(polygonsGeoJson => {
          if (!polygonsGeoJson) {
            this.layerGeoJsons[polygonLayer.name] = null;
            return null;
          }

          this.layerGeoJsons[polygonLayer.name] = {
            geoJson: polygonsGeoJson,
            bounds: bounds
          };

          return (
            <GeoJSON
              key={Math.random()}
              data={polygonsGeoJson}
              style={ViewerUtility.createGeoJsonLayerStyle(`#${polygonLayer.color}`, null, 0)}
              zIndex={ViewerUtility.polygonLayerZIndex + i}
              onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature, polygonLayer.hasAggregatedData, null, null, filter) })}
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

  onFeatureClick = (feature, hasAggregatedData, color, cb, filter) => {
    this.props.onFeatureClick(feature, hasAggregatedData, color, cb, filter);
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
      'polygons',
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
              {'Polígonos'}
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

export default PolygonLayersControl;
