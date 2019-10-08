import React, { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';

import ApiManager from '../../../ApiManager';
import ErrorHandler from '../../../ErrorHandler';

class ResetPassword extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      success: false
    };
  }

  resetPassword = () => {
    let email = this.refs.emailInput.value;

    if (email === '') {
      return;
    }

    let body = {
      email: email
    };

    ApiManager.post(`/account/resetPassword`, body, this.props.user)
      .then(() => {
        this.setState({ success: true });
      })
      .catch(err => {
        ErrorHandler.alert(err);
      });
  }

  onEnter = (event) => {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.resetPassword();
    }
  }

  render() {
    return (
      <div className="login-block">
        <h1 className='account-title'>
          {"Restablecer su contraseña"}
        </h1>
        {
          this.state.success ?
          <div className='main-content'>
            <h2>{"Éxito"}</h2>
            <p>
              {"Hemos enviado un correo electrónico a la dirección de correo electrónico especificada."}
            </p>
            <p>
              {"Siga el procedimiento en el correo electrónico para continuar."}
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
                {"E-mail"}
              </div>
              <div>
                <input className='login-input' type='email' tabIndex={0} ref='emailInput'></input>
              </div>
            </div>
            <div className='login-input-label-div' onClick={this.resetPassword.bind(this)} onKeyUp={this.onEnter.bind(this)}>
              <div className="button main-block-single-button" tabIndex={0}>
                {"Restablecer la contraseña"}
              </div>
            </div>
          </form>
        }

      </div>
    );
  }
}

export default ResetPassword;
