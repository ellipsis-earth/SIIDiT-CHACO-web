import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';

import ApiManager from '../../../ApiManager';
import ErrorHandler from '../../../ErrorHandler';

class Register extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      success: false,
      submitting: false
    };
  }

  register = () => {
    let username = this.refs.usernameInput.value;
    let password = this.refs.passwordInput.value;
    let repeatPassword = this.refs.repeatPasswordInput.value;
    let email = this.refs.emailInput.value;

    if (username === '' || password === '' || repeatPassword === '' || email === '') {
      return;
    }

    this.setState({ submitting: true }, () => {
      if (password !== repeatPassword) {
        alert('La contraseña y la contraseña de repetición no coinciden.');
        return;
      }

      let body = {
        username: username,
        password: password,
        email: email
      };

      ApiManager.post(`/account/register`, body)
        .then(() => {
          this.setState({ success: true, submitting: false });
        })
        .catch(error => {
          ErrorHandler.alert(error);
          this.setState({ submitting: false });
        });
      });
  }

  onEnter = (event) => {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.register();
    }
  }

  render() {
    return (
      <div className="login-block">
        <h1 className='account-title'>
          {" Registro"}
        </h1>
        {
          this.state.success ?
            <div className='main-content'>
              <h2>{"Éxito"}</h2>
              <p>
                {' Le hemos enviado un correo electrónico para validar su dirección de correo electrónico. Por favor, siga los procedimientos en el correo.'}
              </p>
              <p>
                {"Debe verificar su correo electrónico antes de poder iniciar sesión."}
              </p>
              <div>
                <NavLink to='/login' style={{fontSize: '12pt'}}>
                  {"Iniciar"}
                </NavLink>
              </div>
            </div>
            :
            <form>
              <div className='login-input-label-div'>
                <div>
                  {"Nombre de usuario"}
                </div>
                <div>
                  <input className='login-input' tabIndex={0} ref='usernameInput'></input>
                </div>
              </div>
              <div className='login-input-label-div'>
                <div>
                  {"Contraseña"}
                </div>
                <div>
                  <input className='login-input' tabIndex={0} type='password' ref='passwordInput'></input>
                </div>
              </div>

              <div className='login-input-label-div'>
                <div>
                  {"Repite la contraseña"}
                </div>
                <div>
                  <input className='login-input' tabIndex={0} type='password' ref='repeatPasswordInput' onKeyUp={this.onEnter.bind(this)}></input>
                </div>
              </div>

              <div className='login-input-label-div'>
                <div>
                  {"E-mail"}
                </div>
                <div>
                  <input className='login-input' tabIndex={0} type='email' ref='emailInput' onKeyUp={this.onEnter.bind(this)}></input>
                </div>
              </div>
              {
                this.state.submitting ?
                  <img className='loading-spinner' src='/images/spinner.png' alt='spinner' /> :
                  <div className='login-input-label-div' onClick={this.register.bind(this)} onKeyUp={this.onEnter.bind(this)} disabled={this.state.submitting}>
                    <div className="button main-block-single-button" tabIndex={0}>
                      {"Registro"}
                    </div>
                  </div>
              }

            </form>
        }

      </div>
    );
  }
}

export default Register;
