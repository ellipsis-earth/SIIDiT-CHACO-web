import React, { PureComponent } from 'react';
import { Redirect } from 'react-router';

import Card from '@material-ui/core/Card'
import Button from '@material-ui/core/Button'
import CardHeader from '@material-ui/core/CardHeader'
import CardContent from '@material-ui/core/CardContent'
import CardActions from '@material-ui/core/CardActions'
import IconButton from '@material-ui/core/IconButton'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'

import ClearIcon from '@material-ui/icons/Clear';
import SaveAlt from '@material-ui/icons/SaveAlt';

import AnnotatePane from '../AnnotatePane/AnnotatePane';

import ViewerUtility from '../ViewerUtility';

import './SelectionPane.css';
import ApiManager from '../../../ApiManager';


const DELETE_CUSTOM_POLYGON_ACTION = 'delete_custom_polygon';
const ANNOTATE_ACTION = 'annotate';

class SelectionPane extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      isOpen: false,
      loading: false,
      redirect: false,
    };

    this.filterInformation = ["bfe00499-c9f4-423f-b4c6-9adfd4e91d1e", "963c2e9f-068a-4213-8cb7-cf336c57d40e", "7373e49b-dae5-48e0-b937-7ee07a9d5cb2", "e56e3079-a0e1-4e44-8aef-219dde0cb850", "e3fa7c52-f02c-4977-bdd9-33b250da9b33", "5410fdcd-6b17-414c-8be3-c973db5bd0f9", "e99121e1-9d6e-4bfb-94b6-0b8ca1492ff3", "5e45ea5c-1f1c-47bf-9309-12316200cf61"];
  }

  async componentDidUpdate(prevProps) {
    if (!this.props.map || prevProps.map !== this.props.map || !this.props.element) {
      this.setState({ isOpen: false });
    }
    else if (prevProps.element !== this.props.element) {
      this.props.closePanes('selection');
      if(this.props.element && this.props.element.type === ViewerUtility.standardTileLayerType)
      {
        this.setState({isOpen: true, tileInfo: await this.getInfo()});
      }
      else
      {
        this.setState({isOpen: true});
      }
    }
  }

  getInfo = async () => {
    let body = {
      mapId: this.props.map.id,
      tileId: this.props.element.feature.properties,
      timestamp: this.props.timestampRange.end
    };

    return await ApiManager.post('/raster/info', body, this.props.user, 'v2')
    .then((info) => {
      let filter = info.filter(version => version.band === 'label');
      return filter;
    })
    .catch(err => {
      console.error(err)
    });
  }

  open = () => {
    this.props.closePanes('selection');
    this.setState({ isOpen: true });
  }

  refresh = () => {
    this.forceUpdate();
  }

  deleteCustomPolygon = () => {
    this.setState({ loading: true }, () => {
      let body = {
        mapId: this.props.map.id,
        polygonId: this.props.element.feature.properties.id
      };

      ApiManager.post('/geometry/deletePolygon', body, this.props.user)
        .then(() => {
          this.props.onDeletePolygon();
          this.props.onDeselect();
          this.setState({ isOpen: false, loading: false });
        })
        .catch(err => {
          console.log(err);
          this.setState({ loading: false });
        });
    });

  }

  onCloseClick = () => {
    this.props.onDeselect();

    this.setState({ isOpen: false });
  }

  onElementActionClick = (action) => {
    if (action === DELETE_CUSTOM_POLYGON_ACTION) {
      this.deleteCustomPolygon();
    }
    else if (action === ANNOTATE_ACTION) {
      this.setState({ annotate: true });
    }
    else {
      this.props.onDataPaneAction(action);
    }
  }

  onDownload = () => {
    let element = this.props.element;

    if (!element) {
      return;
    }

    let type = element.type;
    let feature = element.feature;

    let nameComponents = [this.props.map.name];

    if (type === ViewerUtility.standardTileLayerType) {
      nameComponents.push(
        'tile',
        feature.properties.tileX,
        feature.properties.tileY,
        feature.properties.zoom
      );
    }
    else if (type === ViewerUtility.polygonLayerType) {
      nameComponents.push('polygon', feature.properties.id);
    }
    else if (type === ViewerUtility.drawnPolygonLayerType) {
      nameComponents.push('drawnPolygon');
    }

    let fileName = nameComponents.join('_').replace(' ', '_') + '.geojson';

    let geoJson = {
      type: 'FeatureCollection',
      count: 1,
      features: [feature]
    };

    ViewerUtility.download(fileName, JSON.stringify(geoJson), 'application/json');
  }

  onAnnotatePaneClose = () => {
    this.setState({ annotate: false });
  }

  render() {
    if (this.state.redirect) {
      return <Redirect push to="/login" />;
    }

    if (!this.state.isOpen) {
      return null;
    }

    let map = this.props.map;
    let element = this.props.element;

    if (!map || !element) {
      return null;
    }

    let title = null;

    let user = this.props.user;
    let mapAccessLevel = map.accessLevel;

    let firstRowButtons = [];
    let secondRowButtons = [];

    firstRowButtons.push(
      <Button
        key='analyse'
        variant='outlined'
        size='small'
        className='selection-pane-button'
        onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.analyse)}
        disabled={mapAccessLevel < ApiManager.accessLevels.aggregatedData}
      >
        {'ANALIZAR'}
      </Button>
    );

    if (element.type !== ViewerUtility.drawnPolygonLayerType && mapAccessLevel >= 525) {
      firstRowButtons.push((
        <Button
          key='geoMessage'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.geoMessage)}
          disabled={mapAccessLevel < ApiManager.accessLevels.viewGeoMessages}
        >
        {'MENSAJE'}
        </Button>
      ));
    }

    if (element.type === ViewerUtility.standardTileLayerType || (element.filter && element.filter.type === 'tile')) {
      title = 'Teja';
      if (user)
      {
        secondRowButtons.push(<Button
            key='edit'
            variant='outlined'
            size='small'
            className='selection-pane-button'
            onClick={() => this.onElementActionClick(ANNOTATE_ACTION)}
            disabled={mapAccessLevel < ApiManager.accessLevels.submitRasterData}
          >
            ANNOTATE
          </Button>)
      }
    }
    else if (element.type === ViewerUtility.polygonLayerType) {
      title = 'Polígono';

      let canEdit = user &&
        (mapAccessLevel > ApiManager.accessLevels.alterOrDeleteCustomPolygons ||
        element.feature.properties.user === user.username);

      if (user)
      {
        let layer = this.props.map.layers.polygon.find(x => x.name === element.feature.properties.layer);
        if (!element.filter && !(layer && this.filterInformation.includes(layer.id)))
        {
          secondRowButtons.push(
            <Button
              key='edit'
              variant='outlined'
              size='small'
              className='selection-pane-button'
              onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.editCustomPolygon)}
              disabled={!canEdit}
            >
              {'EDITAR'}
            </Button>,
            <Button
              key='delete'
              variant='outlined'
              size='small'
              className='selection-pane-button'
              onClick={() => this.onElementActionClick(DELETE_CUSTOM_POLYGON_ACTION)}
              disabled={!canEdit}
            >
              {'BORRAR'}
            </Button>
          );
        }
      }
      else
      {
        secondRowButtons.push(<Button
          key='logIn'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => {this.setState({redirect: true})}}
        >
          {'INICIAR'}
        </Button>)
      }
    }
    else if (element.type === ViewerUtility.drawnPolygonLayerType) {
      title = 'Drawn polygon';

      let nonRestrictedLayer = this.props.map.layers.polygon.find(x => !x.restricted);

      let canAdd = user &&
        mapAccessLevel >= ApiManager.accessLevels.addPolygons &&
        (nonRestrictedLayer || mapAccessLevel >= ApiManager.accessLevels.addRestrictedPolygons);

      firstRowButtons.push(
        <Button
          key='add'
          variant='outlined'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.createCustomPolygon)}
          disabled={!canAdd}
        >
          {'AÑADIR'}
        </Button>
      );
    }

    let elementProperties = element.feature.properties;
    let properties = [];

    let selectionPaneClass = 'selection-pane';

    for (let property in elementProperties) {

      let propertyValue = elementProperties[property];

      if (element.type === ViewerUtility.drawnPolygonLayerType && property === 'id') {
        continue;
      }
      if (element.type === ViewerUtility.customPolygonTileLayerType
        && property === ViewerUtility.isPrivateProperty) {
        if (propertyValue === true) {
          selectionPaneClass += ' selection-pane-private';
        }
        continue;
      }

      if (elementProperties.hasOwnProperty(property)) {
        properties.push((
          <div key={property}>
            {`${property}: ${propertyValue}`}
          </div>
        ))
      }
    }

    return (
      <div>
        {this.state.annotate && this.props.map.accessLevel >= 515 ?
          <AnnotatePane
            map={this.props.map}
            user={this.props.user}
            tileId={this.props.element.feature.properties}
            timestamp={this.props.timestampRange.end}
            onClose={this.onAnnotatePaneClose}
            tileInfo={this.state.tileInfo}
          /> : null
        }

        <Card className={selectionPaneClass}>
          <CardHeader
            className='material-card-header'
            title={
              <Button
                onClick={() => this.props.onFlyTo({
                  type: ViewerUtility.flyToType.currentElement
                })}
              >
                <Typography variant="h6" component="h2" className='no-text-transform'>
                  {title}
                </Typography>
              </Button>
            }
            action={
              <div>
                <IconButton
                  onClick={this.onDownload}
                  aria-label='Download'
                >
                  <SaveAlt />
                </IconButton>
                <IconButton
                  onClick={this.onCloseClick}
                  aria-label='Close'
                >
                  <ClearIcon />
                </IconButton>
              </div>
            }
          />
          <CardContent className={'card-content'}>
            {properties}
            { this.state.loading ? <CircularProgress className='loading-spinner'/> : null}
          </CardContent>
          <CardActions className={'selection-pane-card-actions'}>
            <div key='first_row_buttons'>
              {firstRowButtons}
            </div>
            <div key='secont_row_buttons' style={ {marginLeft: '0px' }}>
              {secondRowButtons}
            </div>
          </CardActions>
        </Card>
      </div>
    );
  }
}

export default SelectionPane;
