import { combineReducers } from 'redux';

import { hosts, selectedHosts, calledUpdateHosts } from './hosts';

import { SHOW_SNACK,
         HIDE_SNACK,
         SET_LANGUAGE,
         SET_WHOLE_ONLINE,
         WRITE_PERMISSION,
         SELECT_HOSTS,
         UPDATE_HOSTS,
         REMOVE_HOSTS,
         SWITCH_HOSTS_POSITION } from '../actions/main';

const snack = (state = {}, action) => {
    switch (action.type) {
        case SHOW_SNACK:
            return action.value || state;
        case HIDE_SNACK:
            return {};
        default:
            return state;
    }
}

const online = (state = true, action) => {
    switch (action.type) {
        case SET_WHOLE_ONLINE:
            return action.value || state;
        default:
            return state;
    }
}

const language = (state = '', action) => {
    switch (action.type) {
        case SET_LANGUAGE:
            return action.value || state;
        default:
            return state;
    }
}

const should_save_system_hosts = (state = false, action) => {
    switch (action.type) {
        case SELECT_HOSTS:
        case UPDATE_HOSTS:
        case REMOVE_HOSTS:
        case SET_WHOLE_ONLINE:
        case SWITCH_HOSTS_POSITION:
            return true;
        default:
            return false;
    }
}

export default combineReducers({
    snack,
    hosts,
    online,
    language,
    selectedHosts,
    should_save_system_hosts,
    updatingHosts: calledUpdateHosts,
});