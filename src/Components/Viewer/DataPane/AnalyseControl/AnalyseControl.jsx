import React, { PureComponent } from 'react';
import Papa from 'papaparse';
import LineChart from './LineChart/LineChart';

import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  CircularProgress,
  Slider,
  Select,
  MenuItem,
  Collapse,
  IconButton,
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import ViewerUtility from '../../ViewerUtility';
import DataPaneUtility from '../DataPaneUtility';

import './AnalyseControl.css';
import ApiManager from '../../../../ApiManager';

const DEFAULT_SELECTED_CLASS = 'default';

class AnalyseControl extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      classesLoading: false,
      measurementsLoading: false,

      availableClasses: null,
      selectedClass: DEFAULT_SELECTED_CLASS,

      classesData: null,
      measurementsData: {},

      classesExpanded: true,
      measurementsExpanded: true,

      maxMask: 1
    };
  }

  componentDidMount() {
    this.setState({ classesLoading: true }, () => {
      this.getAvailableClasses();
      this.getData(ViewerUtility.dataGraphType.classes);
    });
  }

  componentDidUpdate(prevProps) {
    let differentMap = this.props.map !== prevProps.map;
    if (differentMap) {
      this.getAvailableClasses();
    }

    if (!this.props.element) {
      this.setState({ classesData: null, measurementsData: {} });
      return;
    }

    let differentElement = differentMap || DataPaneUtility.isDifferentElement(prevProps.element, this.props.element);

    if (differentElement) {
      this.setState({
          classesData: null,
          measurementsData: {},
          classesLoading: true,
          measurementsLoading: true,
        }, () => {
          this.getData(ViewerUtility.dataGraphType.classes);
          this.getData(ViewerUtility.dataGraphType.measurements, this.state.selectedClass)
      });
    }
  }

  getAvailableClasses = () => {
    let availableClasses = [];

    let map = this.props.map;

    if (!map.perClass) {
      availableClasses.push(ViewerUtility.specialClassName.allClasses);
    }
    else {
      for (let i = 0; i < map.classes.length; i++) {
        let timestampClasses = map.classes[i];

        for (let x = 0; x < timestampClasses.classes.length; x++) {
          let className = timestampClasses.classes[x].name;

          if (className === ViewerUtility.specialClassName.outside_area || className === ViewerUtility.specialClassName.mask) {
            continue;
          }

          if (!availableClasses.includes(className)) {
            availableClasses.push(className);
          }
        }
      }
    }

    this.setState({ availableClasses: availableClasses });
  }

  getData = async (type, className) => {
    let element = this.props.element;

    let body = {
      mapId: this.props.map.id,
      class: className
    };
    let urlType = null;

    if (element.type === ViewerUtility.standardTileLayerType) {
      body.tileX = element.feature.properties.tileX;
      body.tileY = element.feature.properties.tileY;
      body.zoom = element.feature.properties.zoom;

      urlType = 'tile';
    }
    else if (element.type === ViewerUtility.polygonLayerType && element.hasAggregatedData) {
      body.polygonId = element.feature.properties.id;

      urlType = 'polygon';
    }
    else if (element.type === ViewerUtility.customPolygonTileLayerType ||
      element.type === ViewerUtility.drawnPolygonLayerType || !element.hasAggregatedData) {
      body.geometry = {
        type: 'FeatureCollection',
        count: 1,
        features: [
          element.feature
        ]
      };

      urlType = 'customPolygon';
    }
    else {
      return;
    }

    let dataPromise = null;
    if (type === ViewerUtility.dataGraphType.classes) {
      dataPromise = ApiManager.post(`/data/class/${urlType}/timestamps`, body, this.props.user);
    }
    else if (type === ViewerUtility.dataGraphType.measurements && className !== 'default') {
      dataPromise = ApiManager.post(`/data/measurement/${urlType}/timestamps`, body, this.props.user);
    }
    else {
      if (type === ViewerUtility.dataGraphType.classes) {
        this.setState({ classesLoading: false });
      }
      else {
        this.setState({ measurementsLoading: false });
      }

      return;
    }

    let data = {};

    dataPromise
      .then(result => {
        data.raw = result;

        let parseFunc = async () => {
          let parsedData = Papa.parse(data.raw, {
            dynamicTyping: true,
            skipEmptyLines: true,
            header: true
          });

          return parsedData;
        };

        return parseFunc();
      })
      .then(result => {
        data.parsed = result;

        if (type === ViewerUtility.dataGraphType.classes) {
          this.setState({ classesData: data, classesLoading: false });
        }
        else if (type === ViewerUtility.dataGraphType.measurements) {
          let newmeasurementsData = {
            ...this.state.measurementsData
          };

          newmeasurementsData[className] = data;

          this.setState({ measurementsData: newmeasurementsData, measurementsLoading: false });
        }
      })
      .catch(err => {
        if (type === ViewerUtility.dataGraphType.classes) {
          this.setState({ classesData: null, classesLoading: false });
        }
        else if (type === ViewerUtility.dataGraphType.measurements) {
          let newmeasurementsData = {
            ...this.state.measurementsData
          };

          this.setState({ measurementsData: newmeasurementsData, measurementsLoading: false });
        }
      });
  }

  renderClassOptions = () => {
    let availableClasses = this.state.availableClasses;

    if (!availableClasses) {
      return null;
    }

    let classOptions = [];

    for (let i = 0; i < availableClasses.length; i++) {
      let className = availableClasses[i];

      classOptions.push(
        <MenuItem key={className} value={className}>{className}</MenuItem>
      )
    }

    return classOptions;
  }

  onSelectClass = (e) => {
    let selectedClass = e.target.value;

    if (!this.state.measurementsData[selectedClass]) {
      this.setState({
        selectedClass: selectedClass,
        measurementsLoading: true
        },
        () => this.getData(ViewerUtility.dataGraphType.measurements, selectedClass)
      );
    }
    else {
      this.setState({ selectedClass: selectedClass });
    }
  }

  onMaxMaskChange = (e, value) => {
    this.setState({ maxMask: value });
  }

  onDownloadData = (isMeasurements) => {
    let csvData = null;

    if (!isMeasurements && this.state.classesData) {
      csvData = this.state.classesData.raw;
    }
    else if (this.state.measurementsData[this.state.selectedClass]) {
      csvData = this.state.measurementsData[this.state.selectedClass].raw;
    }

    let nameComponents = [this.props.map.name];

    let element = this.props.element;
    let elementProperties = element.feature.properties;

    if (element.type === ViewerUtility.standardTileLayerType) {
      nameComponents.push(
        'tile',
        elementProperties.tileX,
        elementProperties.tileY,
        elementProperties.zoom
      );
    }
    else if (element.type === ViewerUtility.polygonLayerType) {
      nameComponents.push(
        'polygon',
        elementProperties.id
      );
    }
    else if (element.type === ViewerUtility.customPolygonTileLayerType) {
      nameComponents.push(
        'customPolygon',
        elementProperties.id
      );
    }
    else if (element.type === ViewerUtility.drawnPolygonLayerType) {
      nameComponents.push(
        'drawnPolygon'
      );
    }

    if (!isMeasurements) {
      nameComponents.push('classes');
    }
    else {
      nameComponents.push(
        'measurements',
        this.state.selectedClass
      );
    }

    let fileName = nameComponents.join('_') + '.csv';

    ViewerUtility.download(fileName, csvData, 'text/csv');
  }

  render() {
    if (this.props.home) {
      return null;
    }

    return (
      <div>
        <Card className='data-pane-card'>
          <CardContent>
            <div>{'Capa de nubes maxiumum'}: {Math.round(this.state.maxMask * 100)}%</div>
            <Slider
              step={0.01}
              value={this.state.maxMask}
              min={0}
              max={1}
              onChange={this.onMaxMaskChange}
            />
          </CardContent>
        </Card>

        <Card className='data-pane-card'>
          <CardHeader
            title={
              <Typography variant="h6" component="h2" className='no-text-transform'>
                {'Clases'}
              </Typography>
            }
            action={
              <IconButton
                className={this.state.classesExpanded ? 'expand-icon expanded' : 'expand-icon'}
                onClick={() => this.setState({ classesExpanded: !this.state.classesExpanded })}
                aria-expanded={this.state.classesExpanded}
                aria-label='Show'
              >
                <ExpandMoreIcon />
              </IconButton>
            }
          />
          <Collapse in={this.state.classesExpanded}>
            <CardContent className='data-pane-card-content'>
              {this.state.classesLoading ? <CircularProgress className='loading-spinner'/> : null}
              {
                !this.state.classesLoading && this.state.classesData ?
                  <LineChart
                    map={this.props.map}
                    data={this.state.classesData}
                    type={ViewerUtility.dataGraphType.classes}
                    maxMask={this.state.maxMask}
                  /> : null
              }
            </CardContent>
            {
              !this.state.classesLoading && this.state.classesData ?
                <CardActions className='analyse-card-actions'>
                  <IconButton
                    onClick={() => this.onDownloadData(false)}
                    aria-label='Descargar'
                  >
                    <SaveAlt />
                  </IconButton>
                </CardActions> : null
            }
          </Collapse>
        </Card>
        <Card className='data-pane-card'>
          <CardHeader
            title={
              <Typography variant="h6" component="h2" className='no-text-transform'>
                {'Mediciones'}
              </Typography>
            }
            action={
              <IconButton
                className={this.state.measurementsExpanded ? 'expand-icon expanded' : 'expand-icon'}
                onClick={() => this.setState({ measurementsExpanded: !this.state.measurementsExpanded })}
                aria-expanded={this.state.measurementsExpanded}
                aria-label='Show'
              >
                <ExpandMoreIcon />
              </IconButton>
            }
          />
          <Collapse in={this.state.measurementsExpanded}>
            <CardContent className='data-pane-card-content analyse-card-content'>
              {
                this.state.availableClasses ?
                  <Select
                    className='class-selector'
                    value={this.state.selectedClass}
                    onChange={this.onSelectClass}
                    disabled={this.state.measurementsLoading}>
                    <MenuItem value={'DEFAULT_SELECTED_CLASS'} disabled hidden>{'Select a class'}</MenuItem>
                    {this.renderClassOptions()}
                  </Select> : null
              }
              {
                !this.state.availableClasses || this.state.measurementsLoading ?
                  <div style={{ position: 'relative', height: '50px' }}>
                    <CircularProgress className='loading-spinner'/>
                  </div> : null
              }
              {
                !this.state.measurementsLoading && this.state.measurementsData[this.state.selectedClass] ?
                  <LineChart
                    map={this.props.map}
                    data={this.state.measurementsData[this.state.selectedClass]}
                    type={ViewerUtility.dataGraphType.measurements}
                    maxMask={this.state.maxMask}
                  /> : null
              }
            </CardContent>
            {
              !this.state.measurementsLoading && this.state.measurementsData[this.state.selectedClass] ?
                <CardActions className='analyse-card-actions'>
                  <IconButton
                    onClick={() => this.onDownloadData(true)}
                    aria-label='Download data'
                  >
                    <SaveAlt />
                  </IconButton>
                </CardActions> : null
            }
          </Collapse>
        </Card>
      </div>
    )
  }
}

export default AnalyseControl;
