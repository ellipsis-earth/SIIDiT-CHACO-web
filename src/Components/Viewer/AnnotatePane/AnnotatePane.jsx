import React, { PureComponent } from 'react';

/*import Button from '@material-ui/core/Button';*/
/*import Card from '@material-ui/core/Card';*/
/*import CardActions from '@material-ui/core/CardActions';*/
/*import CardContent from '@material-ui/core/CardContent';*/
/*import CardHeader from '@material-ui/core/CardHeader';*/
/*import CircularProgress from '@material-ui/core/CircularProgress';*/
import IconButton from '@material-ui/core/IconButton';
/*import Typography from '@material-ui/core/Typography';*/


import ClearIcon from '@material-ui/icons/ClearOutlined';

/*import ViewerUtility from '../ViewerUtility';*/

/*import ApiManager from '../../../ApiManager';*/
import AnnotateTool from './AnnotateTool';

import './AnnotatePane.css';

class AnnotatePane extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {};
  }

/*  componentDidUpdate(prevProps) {
  }*/

  render() {
    return (
      <div className='viewer-modal'>
        <AnnotateTool
          map={this.props.map}
          user={this.props.user}
          tileId={this.props.tileId}
          timestamp={this.props.timestamp}
          onClose={this.props.onClose}
          tileInfo={this.props.tileInfo}
        />
        <div className='viewer-modal-close'>
          <IconButton
            onClick={this.props.onClose}
            color='secondary'
            aria-label='Close'
          >
            <ClearIcon />
          </IconButton>
        </div>
      </div>
    )
  }
}

export default AnnotatePane;
