import React, { Component } from 'react';
import {
    Route
} from 'react-router-dom';
import Modal from 'react-modal';
import { withRouter } from 'react-router';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

import ApiManager from './ApiManager';
import ErrorHandler from './ErrorHandler';

import MainMenu from './Components/MainMenu/MainMenu';
import Viewer from './Components/Viewer/Viewer';
import Login from './Components/Login/Login';
import Account from './Components/Account/Account';


import './App.css';

const localStorageUserItem = 'user';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#7c9c1e'
    },
    secondary: {
      main: '#f5f5f5'
    }
  },
});

class App extends Component {
  topItemRef = null;
  bottomItemRef = null;

  constructor(props, context) {
    super(props, context)
    document.title = 'SIIDiT - CHACO';

    this.topItemRef = React.createRef();
    this.bottomItemRef = React.createRef();

    this.dev = false;
    let accountsUrl = '';

    if(!this.dev)
    {
      accountsUrl = 'https://account.ellipsis-earth.com/';
    }
    else
    {
      let url = window.location.href;
      let split = url.split(':');
      accountsUrl = `${split[0]}:${split[1]}:${(parseInt(split[2].split('/')[0]) + 1)}/`;
    }

    this.state = {
      init: false,
      user: null,
      accountOpen: false,
      accountsUrl: accountsUrl,
    };

  }

  componentDidMount() {
    Modal.setAppElement('body');

    window.addEventListener("message", this.receiveMessage, false);
    return this.retrieveUser();
  }

  receiveMessage = (event) => {
    if (event.origin === 'http://localhost:3001' || 'https://account.ellipsis-earth.com')
    {
      if (event.data.type && event.data.type === 'login')
      {
        this.onLogin(event.data.data);
      }
      if (event.data.type && event.data.type === 'logout')
      {
        this.onLogout();
      }
      if (event.data.type && event.data.type === 'overlayClose')
      {
        this.setState({accountOpen: false}, this.setHome())
      }
    }
  }

  setHome = () => {
    let iframe = document.getElementById("account");
    iframe.contentWindow.postMessage({type: 'home'}, this.accountsUrl);
  }

  openAccounts = (open = !this.state.accountOpen) => {
    this.setState({accountOpen: open})
  }

  closeMenu = () => {
    var x = document.getElementById('main-menu');
    x.className = '';
  }

  retrieveUser = async () => {
    let user = null;
    let userJson = localStorage.getItem(localStorageUserItem);

    if (!userJson) {
      this.setState({ init: true });
      return;
    }

    user = JSON.parse(userJson);

    ApiManager.get(`/account/validateLogin`, null, user)
      .then(() => {
        if (user.username) {
          user.username = user.username.toLowerCase();
        }

        this.setState({ user: user, init: true });
      })
      .catch(() => {
        this.setState({ init: true });
        localStorage.removeItem(localStorageUserItem);
      });
  }

  scrollToBottom = () => {
    this.bottomItemRef.current.scrollIntoView({ behavior: 'smooth' });
  }

  onLogin = (user) => {
    localStorage.setItem(localStorageUserItem, JSON.stringify(user));
    this.setState({ user: user }, () => {
      this.props.history.push('/');
    });
  }

  onLogout = () => {
    localStorage.removeItem(localStorageUserItem);
    this.setState({ user: null });
  }

  onLanguageChange = (language) => {
    if (language !== this.state.language) {
      this.setLanguage(language);
    }
  }

  initAccount = async () => {
    let initObject = {type: 'init', dev: this.dev};
    if (this.state.user){initObject.data = this.state.user}
    let iframe = document.getElementById("account");

    iframe.contentWindow.postMessage(initObject, this.state.accountsUrl);
  }

  render() {
    if (!this.state.init) {
      return null;
    }

    if (this.state.accountOpen)
    {
      let initObject = {type: 'init'};
      if (this.state.user){initObject.data = this.state.user}
      let iframe = document.getElementById("account");
      iframe.contentWindow.postMessage(initObject, this.accountsUrl);
    }

    let contentClassName = 'content';

    return (
      <div className='App' onClick={this.closeMenu}>
        <ThemeProvider theme={theme}>
            {
              <MainMenu
                user={this.state.user}
                onLanguageChange={this.onLanguageChange}
                scrollToBottom={this.scrollToBottom}
                openAccounts={this.openAccounts}
              />
            }
            <div className={contentClassName}>
              <div ref={this.topItemRef}></div>
              <Route exact path='/'
                render={() =>
                  <Viewer
                    user = {this.state.user}
                    scrollToBottom={this.scrollToBottom}
                    key={this.state.user ? this.state.user.name : 'default'}
                  />
                }
              />
              <Route
                path='/login'
                render={() =>
                  <Login
                    onLogin={this.onLogin}
                  />
                }
              />
              <Route
                path='/account'
                render={() =>
                  <Account
                    user={this.state.user}
                    onLogout={this.onLogout}
                  />
                }
              />
              <div className={this.state.accountOpen ? 'account' : 'account hidden'}>
                <iframe src={this.state.accountsUrl} id='account' title='account' onLoad={this.initAccount}/>
              </div>
              <div ref={this.bottomItemRef}></div>
            </div>

        </ThemeProvider>
      </div>
    );

  }

}

export default withRouter(App);
