import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { APP_NAME } from './constants';
import update from './backend/update';
import Lang from './backend/language';
import { loadManifest, saveManifest, saveSystemHosts } from './actions/main';
import configureStore from './stores/configureStore';

import App from './components/App';

const store = configureStore();

const titleDOM = document.getElementsByTagName('title')[0];
titleDOM.innerText = APP_NAME;

store.dispatch(loadManifest());
let unsubscribe = store.subscribe(() => {
    store.dispatch(saveManifest());
    store.dispatch(saveSystemHosts());
});

ReactDOM.render(<Provider store={ store }><App /></Provider>, document.getElementById('app'));

update(false);