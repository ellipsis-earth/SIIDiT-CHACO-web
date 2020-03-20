import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Collapse from '@material-ui/core/Collapse';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';

import moment from 'moment';
import MomentUtils from '@date-io/moment';
import { MuiPickersUtilsProvider, KeyboardDatePicker } from '@material-ui/pickers';


import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';
import DataPaneUtility from '../DataPaneUtility';

import './CustomPolygonControl.css';
import ApiManager from '../../../../ApiManager';

const DATE_FORMAT = 'YYYY-MM-DD';

class CustomPolygonControl extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      loading: false,

      selectedLayer: 'c8511879-1551-4e2c-b03d-7e9c9d3272c9',
      propertyValues: {},
    };
  }

  componentDidMount() {
    this.initialize();
  }

  componentDidUpdate(prevProps) {
    let differentMap = (!prevProps.map && this.props.map) ||
      (prevProps.map && !this.props.map);

    if (!differentMap && prevProps.map && this.props.map) {
      differentMap = prevProps.map.id !== this.props.map.id;
    }

    if (differentMap) {
      this.setState({
        selectedLayer: 'c8511879-1551-4e2c-b03d-7e9c9d3272c9',
        propertyValues: {}
      });
      return;
    }

    let differentElement = (!prevProps.element && this.props.element) ||
      (prevProps.element && !this.props.element);

    if (!differentElement && prevProps.element && this.props.element) {
      let prevId = prevProps.element.feature.properties.id;
      let curId = this.props.element.feature.properties.id;
      differentElement = prevId !== curId;
    }

    if (differentElement || prevProps.isEdit !== this.props.isEdit) {
      this.initialize();
    }
  }

  initialize = () => {
    if (!this.props.isEdit) {
      this.setState({
        selectedLayer: 'c8511879-1551-4e2c-b03d-7e9c9d3272c9',
        propertyValues: {}
      });
    }
    else {
      let properties = {
        ...this.props.element.feature.properties
      };

      let layer = properties.layer;
      delete properties.id;
      delete properties.layer;

      this.setState({
        selectedLayer: layer,
        propertyValues: properties,
      });
    }
  }

  onSelectLayer = (e) => {
    this.setState({ selectedLayer: e.target.value });
  }

  onPropertyValueChange = (e, property) => {
    let newPropertyValues = {
      ...this.state.propertyValues
    };

    let value = null;

    if (property === 'date')
    {
      value = moment(e).format(DATE_FORMAT);
    }
    else
    {
      value = e.target.value;
    }

    newPropertyValues[property] = value;

    this.setState({ propertyValues: newPropertyValues });
  }

  onSubmit = () => {
    this.setState({ loading: true }, () => {

      if (!this.props.isEdit) {
        this.addCustomPolygon();
      }
      else {
        this.editCustomPolygon();
      }

    });
  }

  addCustomPolygon = () => {
    let layer = this.state.selectedLayer;

    let feature = this.props.element.feature;

    let date = this.state.propertyValues.date ? this.state.propertyValues.date : moment(this.props.map.timestamps[this.props.map.timestamps.length - 1].dateTo).format(DATE_FORMAT);
    //Check for timestamp closest to given date

    let timestampNumber = this.props.map.timestamps[this.props.map.timestamps.length - 1].timestamp;

    for (let i = 0; i < this.props.map.timestamps.length; i++) {
      if(moment(this.props.map.timestamps[i].dateTo).format(DATE_FORMAT) === date)
      {
        timestampNumber = this.props.map.timestamps[i].timestamp;
      }
      else if(!moment(this.props.map.timestamps[i].dateTo).isBefore(date))
      {
        timestampNumber = i === 0 ? -1 : this.props.map.timestamps[i - 1].timestamp;
      }
    }

    feature.properties = {timestamp: timestampNumber, date: date};

    let body = {
      mapId: this.props.map.id,
      layer: layer === -1 ? this.props.map.layers.polygon.find(x => x.id === '09834825-403d-4e5b-9883-ac1bff14ae1f').name : this.props.map.layers.polygon.find(x => x.id === layer).name,
      feature: feature
    };

    ApiManager.post('/geometry/add', body, this.props.user, 'v2')
      .then(() => {
        alert('Polygon received. It can take a few moments before it is visible.');

        this.props.onPolygonChange(true, false);
        this.setState({
          loading: false,
          propertyValues: {}
        });
      })
      .catch(err => {
        if (err && err.status === 400) {
          alert(err.message);
        }
        console.log(err);
        this.setState({ loading: false });
      });
  }

  editCustomPolygon = () => {
    let layer = this.state.selectedLayer;
    let properties = this.state.propertyValues;

    let selectedLayerProperties = this.props.map.layers.polygon.find(
      x => x.name === this.state.selectedLayer
    ).properties;

    for (let prop in properties) {
      if (Object.prototype.hasOwnProperty.call(properties, prop) &&
        !selectedLayerProperties.includes(prop)) {
        delete properties[prop];
      }
    }

    let oldProperties = this.props.element.feature.properties;

    let body = {
      mapId: this.props.map.id,
      polygonId: oldProperties.id,
      newLayerName: layer,
      newProperties: properties,
    };

    ApiManager.post('/geometry/alterPolygon', body, this.props.user)
      .then(() => {
        properties.id = oldProperties.id;
        properties.layer = layer;
        this.props.onPolygonChange(false, true, properties);
        this.setState({
          loading: false
        });
      })
      .catch(err => {
        console.error(err);
        this.setState({ loading: false });
      });
  }

  render() {
    if (this.props.home) {
      return null;
    }

    let title = 'Add';
    if (this.props.isEdit) {
      title = 'Edit';
    }

    let layers = this.props.map.layers.polygon;
    /*let layerSelect = null;
    if (layers.length > 0) {
      let options = [
        <MenuItem key='default' value='default' disabled hidden>Select a layer</MenuItem>
      ];

      for (let i = 0; i < layers.length; i++) {
        let layer = layers[i];
        console.log(layer.id === 'c8511879-1551-4e2c-b03d-7e9c9d3272c9');

        let filter = ['b4cfa212-9547-4d43-9119-1db5482954a3', '647c9802-f136-4029-aa6d-884396be4e9b'];

        if ((layer.restricted && this.props.map.accessLevel < ApiManager.accessLevels.addRestrictedPolygons) || filter.includes(layer.id)) {
          continue;
        }

        let layerName = layer.name;
        options.push(
          <MenuItem key={layerName} value={layerName}>{layerName}</MenuItem>
        );
      }

      layerSelect = (
        <Select
          key='layer-selector'
          className='selector'
          onChange={this.onSelectLayer}
          value={this.state.selectedLayer}
        >
          {options}
        </Select>
      );
    }
    else {
      layerSelect = 'No layers available.'
    }*/

    let propertyInputs = null;
    let selectedLayer = layers.find(x => x.id === this.state.selectedLayer)

    if (selectedLayer) {
      let inputs = [];

      for (let i = 0; i < selectedLayer.properties.length; i++) {
        let property = selectedLayer.properties[i];

        if(property === 'date')
        {
          inputs.push(
            <MuiPickersUtilsProvider utils={MomentUtils} key={property}>
              <KeyboardDatePicker
                margin="normal"
                label={property}
                format={DATE_FORMAT}
                value={this.state.propertyValues[property] ? this.state.propertyValues[property] : moment(this.props.map.timestamps.find(x => x.timestamp === this.props.timestampRange.end).dateTo).format(DATE_FORMAT)}
                onChange={(e) => this.onPropertyValueChange(e, property)}
                DialogProps={{style:{zIndex: 2500}}}
                disableFuture
              />
            </MuiPickersUtilsProvider>
          );
        }
        else
        {
          inputs.push(
            <TextField
              className='card-content-item data-pane-text-field'
              key={property}
              label={property}
              value={this.state.propertyValues[property]}
              onChange={(e) => this.onPropertyValueChange(e, property)}
            />
          );
        }
      }

      propertyInputs = (
        <div>
          {inputs}
          <div className='card-content-item'>
            <Button
              className='card-submit-button'
              variant='contained'
              color='primary'
              onClick={this.onSubmit}
              disabled={this.state.loading}
              startIcon={this.state.loading ? <CircularProgress size={12}/> : null}
            >
              Submit
            </Button>
          </div>

        </div>
      );
    }

    return (
      <div>
        <Card className={'data-pane-card'}>
          <CardHeader
            className='data-pane-title-header'
            title={
              <Typography variant="h6" component="h2" className='no-text-transform'>
                {title}
              </Typography>
            }
          />
          <CardContent>
            {/*layerSelect*/}
            {propertyInputs}
          </CardContent>

        </Card>
      </div>
    );
  }
}



export default CustomPolygonControl;
