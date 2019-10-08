import React, { PureComponent } from 'react';
import { NavLink, Redirect } from 'react-router-dom';

import ApiManager from '../../../ApiManager';
import ErrorHandler from '../../../ErrorHandler';

class ChangeEmail extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      success: false
    };
  }

  changeEmail = () => {
    let newEmail = this.refs.newEmailInput.value;

    if (newEmail === '') {
      return;
    }

    let body = {
      newEmail: newEmail
    };

    ApiManager.post(`/account/changeEmail`, body, this.props.user)
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
      this.changeEmail();
    }
  }

  render() {
    if (!this.props.user) {
      return (
        <Redirect to='/login'></Redirect>
      )
    }

    return (
      <div className='login-block'>
        <h1 className='account-title'>
          {'Cambiar e-mail'}
        </h1>
        {
          this.state.success ?
          <div className='main-content'>
            <h2>{"Éxito"}</h2>
            <p>
              {"Le hemos enviado un correo electrónico para validar su dirección de correo electrónico. Por favor, siga los procedimientos en el correo."}
            </p>
            <div>
              <NavLink to='/account/management' style={{fontSize: '12pt'}}>
                {'Administración de cuentas'}
              </NavLink>
            </div>
          </div>
          :
          <form>
            <div className='login-input-label-div'>
              <div>
                {'Nuevo e-mail'}
              </div>
              <div>
                <input className='login-input' type='email' tabIndex={0} ref='newEmailInput'></input>
              </div>
            </div>

            <div className='login-input-label-div' onClick={this.changeEmail.bind(this)} onKeyUp={this.onEnter.bind(this)}>
              <div className='button main-block-single-button' tabIndex={0}>
                {'Cambiar e-mail'}
              </div>
            </div>
          </form>
        }
      </div>
    );
  }
}

export default ChangeEmail;
