import React, { PureComponent } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default class MobileWarning extends PureComponent {
  render = () => {
    return (
       <div>
        <Dialog
          open={this.props.open}
          onClose={() => this.props.handleClose(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{"Data Warning"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              This is a big request. If not connected to WiFi, this can deplete your data bundle quickly. 
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => this.props.handleClose(false)}color="primary">
              Do not load
            </Button>
            <Button onClick={() => this.props.handleClose(true)} color="primary" autoFocus>
              I understand and load
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}