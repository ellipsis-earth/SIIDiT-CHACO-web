import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import CardContent from '@material-ui/core/CardContent';
import CircularProgress from '@material-ui/core/CircularProgress';

import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import './DataPane.css';
import ViewerUtility from '../ViewerUtility';

import LegendControl from './LegendControl/LegendControl';
import AnalyseControl from './AnalyseControl/AnalyseControl';
import GeoMessageControl from './GeoMessageControl/GeoMessageControl';
import CustomPolygonControl from './CustomPolygonControl/CustomPolygonControl';

import InfoCards from './InfoCards/InfoCards';
import DeforestationCard from './InfoCards/DeforestationCard';

import ApiManager from '../../../ApiManager';

class DataPane extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      home: true,
    };
  }

  componentDidMount() {
  }

  componentDidUpdate(prevProps) {
    let differentAction = this.props.action && prevProps.action !== this.props.action;

    if (differentAction && this.state.home) {
      this.setState({ home: false });
    }
    else if (prevProps.action && !this.props.action && !this.state.home) {
      this.setState({ home: true });
    }
  }

  goToAction = () => {
    this.setState({ home: false });
  }

  onFlyTo = () => {
    let action = this.props.action;

    if (action === ViewerUtility.dataPaneAction.feed || this.state.home) {
      this.props.onFlyTo({ type: ViewerUtility.flyToType.map });
    }
    else {
      this.props.onFlyTo({ type: ViewerUtility.flyToType.currentElement });
    }
  }

  render() {
    let style = {};
    if (!this.props.isOpen) {
      style = { display: 'none' };
    }

    let home = this.state.home;

    let element = this.props.element;
    let action = this.props.action;
    let title = '';
    let idText = null;
    let homeElement = null;
    let actionControl = null;

    if (home) {
      title = 'Mapa';
      let map = this.props.map;

      if (map) {
        idText = map.name;

        let hasGeoMessageAccess = map && map.accessLevel >= ApiManager.accessLevels.viewGeoMessages;
        homeElement = (
          <div>
            {map.accessLevel >= 525 ? [<Button
                className='geomessage-feed-button'
                variant='contained'
                color='primary'
                disabled={!hasGeoMessageAccess}
                onClick={() => this.props.onDataPaneAction(ViewerUtility.dataPaneAction.feed)}
                key='geoMessageFeedButton'
              >
                {'MENSAJES'}
              </Button>, <br key='geoMessageFeedBreak'/> ]: null}
            {/*<DeforestationCard map={this.props.map} totals={this.props.totals} setTotals={this.props.setTotals}/>*/}
            <InfoCards />
            <LegendControl
              map={this.props.map}
            />
          </div>
        );
      }
      else {
        return (
          <div className='viewer-pane data-pane' style={style}>
            <CircularProgress className='loading-spinner'/>
            <p>Data is loading, please wait.</p>
          </div>
        )
      }
    }
    else if (action === ViewerUtility.dataPaneAction.feed) {
      title = 'MENSAJES';
      idText = this.props.map.name;
    }
    else if (element) {
      if (element.type === ViewerUtility.standardTileLayerType || (element.filter && element.filter.type === 'tile')) {
        title = 'Teja';
        idText = `${element.feature.properties.tileX}, ${element.feature.properties.tileY}, ${element.feature.properties.zoom}`;
      }
      else if (element.type === ViewerUtility.polygonLayerType) {
        title = 'Polígono';
        idText = element.feature.properties.id;
      }
      else if (element.type === ViewerUtility.customPolygonTileLayerType) {
        title = 'Custom polygon';
        idText = element.feature.properties.id;
      }
      else if (element.type === ViewerUtility.drawnPolygonLayerType) {
        title = 'Drawn polygon';
        idText = 'Drawn polygon';
      }
    }

    if (action === ViewerUtility.dataPaneAction.analyse) {
      actionControl = (
        <AnalyseControl
          user={this.props.user}
          map={this.props.map}
          element={this.props.element}
          home={home}
        />
      );
    }
    else if (action === ViewerUtility.dataPaneAction.geoMessage ||
      action === ViewerUtility.dataPaneAction.feed) {
      actionControl = (
        <GeoMessageControl
          user={this.props.user}
          map={this.props.map}
          timestampRange={this.props.timestampRange}
          geolocation={this.props.geolocation}
          element={this.props.element}
          isFeed={action === ViewerUtility.dataPaneAction.feed}
          jumpToMessage={this.props.jumpToMessage}
          home={home}
          onDataPaneAction={this.props.onDataPaneAction}
          onFlyTo={this.props.onFlyTo}
          onLayersChange={this.props.onLayersChange}
          onFeatureClick={this.props.onFeatureClick}
          onDeselect={this.props.onDeselect}
        />
      );
    }
    else if (action === ViewerUtility.dataPaneAction.createCustomPolygon ||
      action === ViewerUtility.dataPaneAction.editCustomPolygon) {
        actionControl = (
          <CustomPolygonControl
            user={this.props.user}
            map={this.props.map}
            timestampRange={this.props.timestampRange}
            element={this.props.element}
            isEdit={action === ViewerUtility.dataPaneAction.editCustomPolygon}
            home={home}
            onFlyTo={this.props.onFlyTo}
            onPolygonChange={this.props.onPolygonChange}
          />
        );
    }

    let dataPaneClassName = 'viewer-pane data-pane';
    if (action === ViewerUtility.dataPaneAction.feed) {
      dataPaneClassName += ' no-scroll';
    }

    let actionsClassName = 'data-pane-title-actions';
    if (home) {
      actionsClassName += ' data-pane-title-actions-right'
    }

    return (
      <div className={dataPaneClassName} style={style}>

        <Card className='data-pane-title-card'>
          <CardActions className={actionsClassName}>
            {
              !home || action ?
                <IconButton
                  className='data-pane-title-actions-button'
                  aria-label='Home'
                  onClick={() => this.setState({ home: !home })}
                >
                  {home ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
                </IconButton> : null
            }
          </CardActions>
          <CardHeader
            className='data-pane-title-header'
            title={
              <Typography
                variant="h6"
                component="h2"
                className='no-text-transform data-pane-title'
              >
                {title}
              </Typography>
            }
            subheader={
              idText ?
                <Button
                  onClick={this.onFlyTo}
                >
                  <div>
                    {idText}
                  </div>
                </Button> : null
            }
          />
        </Card>
        {homeElement}
        {actionControl}
      </div>
    );
  }
}

export default DataPane;
