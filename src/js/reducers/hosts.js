import { ADD_HOSTS,
         SELECT_HOSTS,
         UPDATE_HOSTS,
         REMOVE_HOSTS,
         CALL_ADD_HOSTS,
         CALL_UPDATE_HOSTS,
         SWITCH_HOSTS_POSITION } from '../actions/main';

const getHostsList = (state) => {
    const hostsList = [];
    for (let uid in state) {
        hostsList.push(state[uid]);
    }
    return hostsList.sort((a, b) => a.index - b.index);
}

export function hosts (state = {}, action) {
    let nextState = state;
    const { type, uid, hosts, options, oldIndex, newIndex, shouldSave } = action;
    switch (type) {
        case ADD_HOSTS:
            hosts.index = getHostsList(state).length;
            nextState = Object.assign({}, state, { [hosts.uid]: hosts });
            shouldSave && hosts.save();
            break;
        case UPDATE_HOSTS:
            const { uid, name, url, text, online, syncing } = options;
            const uHosts = state[uid] || null;
            if (uHosts) {
                if (typeof(name) !== 'undefined' && name !== '') {
                    uHosts.name = name;
                }
                if (typeof(url) !== 'undefined') {
                    uHosts.url = url;
                }
                if (typeof(online) !== 'undefined') {
                    uHosts.online = online;
                }
                if (typeof(text) !== 'undefined') {
                    uHosts.setText(text);
                }
                if (typeof(syncing) !== 'undefined') {
                    uHosts.setSyncing(syncing);
                }
                uHosts.save();
                nextState = Object.assign({}, state, { [uid]: uHosts });
            }
            break;
        case REMOVE_HOSTS:
            nextState = Object.assign({}, state);
            const rmHosts = nextState[uid];
            rmHosts && rmHosts.remove();
            delete nextState[uid];
            break;
        case SWITCH_HOSTS_POSITION:
            nextState = Object.assign({}, state);
            const list = getHostsList(nextState);
            if (oldIndex !== newIndex && oldIndex >= 0 && newIndex <= list.length) {
                list.splice(newIndex, 0, list.splice(oldIndex, 1)[0]);
                list.forEach((__hosts, index) => {
                    __hosts.index = index;
                });
            }
            break;
        default:
            break;
    }
    return nextState;
}

export function selectedHosts (state = '', action) {
    const { type, uid } = action;
    switch (type) {
        case SELECT_HOSTS:
            return uid;
        default:
            return state;
    }
}

export function calledAddHosts (state = false, action) {
    const { type, value } = action;
    switch (type) {
        case CALL_ADD_HOSTS:
            return value;
        default:
            return state;
    }
}

export function calledUpdateHosts (state = '', action) {
    const { type, uid } = action;
    switch (type) {
        case CALL_UPDATE_HOSTS:
            return uid;
        default:
            return state;
    }
}