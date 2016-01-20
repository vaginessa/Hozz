const path = require('path');
const mkdirp = require('mkdirp');

import io from '../backend/io';
import log from '../backend/log';
import Hosts from '../backend/hosts';
import Lang from '../backend/language';
import { MANIFEST,
         WORKSPACE,
         MERGED_HOSTS_UID,
         NO_PERM_ERROR_TAG,
         NO_PERM_ERROR_TAG_WIN32 } from '../constants';

export const SET_WHOLE_ONLINE = 'SET_WHOLE_ONLINE';
export const SET_LANGUAGE = 'SET_LANGUAGE';

export const ADD_HOSTS = 'ADD_HOSTS';
export const SELECT_HOSTS = 'SELECT_HOSTS';
export const UPDATE_HOSTS = 'UPDATE_HOSTS';
export const REMOVE_HOSTS = 'REMOVE_HOSTS';
export const REFACTOR_HOSTS = 'REFACTOR_HOSTS';
export const SWITCH_HOSTS_POSITION = 'SWITCH_HOSTS_POSITION';

export const CALL_ADD_HOSTS = 'CALL_ADD_HOSTS';
export const CALL_UPDATE_HOSTS = 'CALL_UPDATE_HOSTS';

export const PERMISSION_SNACKBAR = 'PERMISSION_SNACKBAR';

try {
    mkdirp.sync(WORKSPACE);
} catch (e) {
    log('Make workspace folder failed: ', e);
}

const sysHostsPath = () => {
    if (process.platform === 'win32') {
        return path.join(process.env.SYSTEMROOT, './system32/drivers/etc/hosts');
    } else {
        return '/etc/hosts';
    }
}

const requestHosts = (uid, url) => {
    return dispatch => {
        if (!url) {
            return;
        }
        dispatch({ type: UPDATE_HOSTS, options: { uid, syncing: true } });
        io.requestUrl(url).then(text => {
            dispatch({ type: UPDATE_HOSTS, options: { uid, url, text, syncing: false } });
        });
    }
}

export function setWholeOnline (online) {
    return { type: SET_WHOLE_ONLINE, value: online };
}

export function setLanguage (language) {
    return { type: SET_LANGUAGE, value: language };
}

export function addHosts (hosts, shouldSave = true) {
    return dispatch => {
        const { uid, url } = hosts;
        dispatch({ type: ADD_HOSTS, hosts, shouldSave });
        dispatch(requestHosts(uid, url));
    }
}

export function updateHosts (options) {
    return (dispatch, getState) => {
        dispatch({ type: UPDATE_HOSTS, options });
        const { uid, url } = options;
        const { hosts } = getState();
        const currentHosts = hosts[uid];
        if (currentHosts && url && url !== currentHosts.url) {
            dispatch(requestHosts(uid, url));
        }
    }
}

export function removeHosts (uid) {
    return { type: REMOVE_HOSTS, uid };
}

export function selectHosts (uid) {
    return { type: SELECT_HOSTS, uid };
}

export function switchHostsPosition (oldIndex, newIndex) {
    return { type: SWITCH_HOSTS_POSITION, oldIndex, newIndex };
}

export function callAddHosts (value) {
    return { type: CALL_ADD_HOSTS, value };
}

export function callUpdateHosts (uid) {
    return { type: CALL_UPDATE_HOSTS, uid };
}

export function loadManifest () {
    return (dispatch, getState) => {
        io.readFile(MANIFEST, 'utf-8').then(text => {
            try {
                return Promise.resolve(JSON.parse(text));
            } catch (e) {
                return Promise.resolve({});
            }
        }, () => {
            return Promise.resolve({});
        }).then(manifest => {
            const { online, language, hosts } = manifest;
            dispatch(setWholeOnline(online));
            dispatch(setLanguage(language || navigator.language || 'en-US'));
            if (hosts && hosts.length) {
                hosts.sort((a, b) => a.index - b.index).forEach((__hosts, index) => {
                    const { uid, url } = __hosts;
                    const hostsCtx = new Hosts(__hosts);
                    hostsCtx.load().then(() => {
                        dispatch(updateHosts({ uid: hostsCtx.uid, text: hostsCtx.text }));
                        dispatch(requestHosts(uid, url));
                    });
                    dispatch(addHosts(hostsCtx, false));
                });
            } else {
                io.readFile(sysHostsPath(), 'utf-8').then((text) => {
                    const systemHosts = Hosts.createFromText(text);
                    systemHosts.name = Lang.get('common.system_hosts');
                    dispatch(addHosts(systemHosts));
                }).catch(log);
            }
        });
    }
}

export function hostsMapToList (hostsMap, toObject = false) {
    const hostsList = [];
    for (let uid in hostsMap) {
        hostsList.push(toObject ? hostsMap[uid].toObject() : hostsMap[uid]);
    }
    return hostsList.sort((a, b) => a.index - b.index);
}

export function mergeHosts (online, hostsList) {
    let totalCount = 0;
    let totalHostsText = '';
    for (let hosts of hostsList) {
        console.log(hosts)
        if (!online) {
            hosts.stashStatus();
        } else {
            hosts.popStatus();
        }
        if (hosts.online) {
            totalHostsText += hosts.text + '\n';
            totalCount += hosts.count;
        }
    }
    return new Hosts({
        uid: MERGED_HOSTS_UID,
        name: 'All',
        count: totalCount,
        text: totalHostsText,
        online: online,
    });
}

export function saveManifest () {
    return (dispatch, getState) => {
        const { online, language, hosts } = getState();
        const obj = {
            online,
            language,
            hosts: hostsMapToList(hosts, true),
        };
        io.writeFile(MANIFEST, JSON.stringify(obj)).catch(log);
    }
}

export function saveSystemHosts () {
    return (dispatch, getState) => {
        const { online, language, hosts } = getState();
        const mergedHosts = mergeHosts(online, hostsMapToList(hosts));
        io.writeFile(sysHostsPath(), online ? mergedHosts.text : '').catch((error) => {
            if (error &&
                error.message &&
                (error.message.indexOf(NO_PERM_ERROR_TAG) > -1 ||
                 error.message.indexOf(NO_PERM_ERROR_TAG_WIN32) > -1)) {
                dispatch({ type: PERMISSION_SNACKBAR });
            }
            log(error);
        });
    }
}