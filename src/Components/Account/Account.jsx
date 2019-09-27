import React, { Component } from "react";
import {
    Route
} from "react-router-dom";

import AccountManagement from './Management/Management';
import ChangePassword from './ChangePassword/ChangePassword';
import ChangeEmail from './ChangeEmail/ChangeEmail';
import ResetPassword from './ResetPassword/ResetPassword';
import Register from './Register/Register';
import MapManagement from './MapManagement/MapManagement';

import ApiManager from '../../ApiManager';
import ErrorHandler from '../../ErrorHandler';

import "./Account.css";

export class Account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      accessLevel: -1,
    }
  }

  componentDidMount()
  {
    ApiManager.get('/account/myMaps', null, this.props.user)
      .then(maps => {
        for (let i = 0; i < maps.length; i++)
        {
          if(maps[i].id === "6b696129-659a-4cf4-8dd6-2cf0642f58db")
          {
            this.setState({ accessLevel: maps[i].accessLevel});
          }
        }
        
      })
      .catch(err => {
        ErrorHandler.alert(err);
      });
  }

  render() {
    return (
      <div>
        <div className="main-content">
          <Route
            exact
            path="/account"
            render={() =>
              <AccountManagement
                language={this.props.language}
                user={this.props.user}
                onLogout={this.props.onLogout}
                accessLevel={this.state.accessLevel}
              />
            }
          />
          <Route
            path="/account/changePassword"
            render={() =>
              <ChangePassword
                language={this.props.language}
                user={this.props.user}
              />
            }
          />
          <Route
            path="/account/changeEmail"
            render={() =>
              <ChangeEmail
                language={this.props.language}
                user={this.props.user}
              />
            }
          />
          <Route
            path="/account/register"
            render={() =>
              <Register
                language={this.props.language}
              />
            }
          />
          <Route
            path="/account/resetPassword"
            render={() =>
              <ResetPassword
                language={this.props.language}
              />
            }
          />
          <Route
            path="/account/mapManagement"
            render={() =>
              <MapManagement
                language={this.props.language}
                user={this.props.user}
                onLogout={this.props.onLogout}
              />
            }
          />
        </div>
      </div>
    )
  }
}

export default Account;
