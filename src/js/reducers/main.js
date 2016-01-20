import { combineReducers } from 'redux';

import { hosts, selectedHosts, calledUpdateHosts } from './hosts';

import { SET_WHOLE_ONLINE,
         SET_LANGUAGE, } from '../actions/main';

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

export default combineReducers({
    hosts,
    online,
    language,
    selectedHosts,
    updatingHosts: calledUpdateHosts,
});