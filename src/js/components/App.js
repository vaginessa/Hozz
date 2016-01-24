import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import Dropzone from 'react-dropzone';

import { EVENT,
         APP_NAME,
         MERGED_HOSTS_UID } from '../constants';

import io from '../backend/io';
import event from '../backend/event';
import Hosts from '../backend/hosts';
import Lang from '../backend/language';
import nw from '../backend/nw.interface';

import { HIDE_SNACK,
         addHosts,
         mergeHosts,
         updateHosts,
         hostsMapToList,
         setWholeOnline, } from '../actions/main';

import Editor from './Editor';
import Sidebar from './Sidebar';
import Titlebar from './Titlebar';
import SnackBar from './SnackBar';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            snack: null,
            searchText: '',
        }
    }

    shouldComponentUpdate (nextProps, nextState) {
        if (this.props.language !== nextProps.language) {
            Lang.setLocale(nextProps.language);
        }
        // TODO: Use Immutable
        if (this.props != nextProps || this.state != nextState) {
            return true;
        }
        return false;
    }

    componentWillReceiveProps (nextProps) {
        this.__createHostsTrayMenu(nextProps);
    }

    __createHostsTrayMenu (props) {
        const menus = [];
        const { dispatch, online, hosts, mergedHosts } = props;
        if (mergedHosts) {
            menus.push({
                type: 'checkbox',
                label: mergedHosts.name,
                checked: mergedHosts.online,
                click: () => {
                    dispatch(setWholeOnline(!online));
                }
            });
        }
        for (let __hosts of hosts) {
            menus.push({
                type: 'checkbox',
                label: __hosts.name,
                checked: __hosts.online,
                click: () => {
                    dispatch(updateHosts({ uid: __hosts.uid, online: online && !__hosts.online }));
                }
            });
        }
        event.emit(EVENT.SET_HOSTS_MENU, menus);
    }

    __updateHosts (uid, text) {
        this.props.dispatch(updateHosts({ uid, text }));
    }

    __onSearchChange (text) {
        this.setState({ searchText: text });
    }

    __onSnackDismiss () {
        this.props.dispatch({ type: HIDE_SNACK });
    }

    __onDrop (files) {
        const promises = io.readDropFiles(files);
        for (let promise of promises) {
            promise.then(result => {
                result && this.props.dispatch(addHosts(new Hosts(result)));
            });
        }
    }

    render() {
        const { searchText } = this.state;
        const { dispatch, snack, hosts, mergedHosts, selectedHosts, updatingHosts } = this.props;
        let list = hosts;
        const selectedUid = selectedHosts ? selectedHosts.uid : '';
        if (searchText) {
            list = list.filter((hosts) => {
                return hosts.name.indexOf(searchText) > -1 || hosts.text.indexOf(searchText) > -1;
            });
        }
        let readOnly = false;
        if (selectedHosts && (MERGED_HOSTS_UID === selectedHosts.uid || selectedHosts.url)) {
            readOnly = true;
        }
        return (<div>
                    <Dropzone
                        className="dropzone"
                        disableClick={ true }
                        activeClassName="dropzone-active"
                        onDrop={ this.__onDrop.bind(this) } >
                        <div>
                            <Sidebar
                                list={ list }
                                dispatch={ dispatch }
                                activeUid={ selectedUid }
                                mergedHosts={ mergedHosts }
                                updatingHosts={ updatingHosts }
                                onSearchChange={ this.__onSearchChange.bind(this) } />
                        </div>
                    </Dropzone>
                    <div className="main-container">
                        <Titlebar
                            closeAsHide={ true }
                            title={ selectedHosts ? selectedHosts.name : APP_NAME } />
                        { snack && snack.text ?
                            <SnackBar
                                type={ snack.type }
                                text={ snack.text }
                                actions={ snack.actions }
                                onDismiss={ this.__onSnackDismiss.bind(this) } /> :
                            null }
                        { selectedHosts ?
                            <Editor
                                uid={ selectedUid }
                                key={ selectedUid }
                                readOnly={ readOnly }
                                value={ selectedHosts.text }
                                onTextShouldUpdate={ !readOnly ? this.__updateHosts.bind(this) : null } /> : null }
                    </div>
                </div>);
    }
};

App.propTypes = {
    hosts: PropTypes.array,
    online: PropTypes.bool,
    language: PropTypes.string,
    mergedHosts: PropTypes.instanceOf(Hosts),
    selectedHosts: PropTypes.instanceOf(Hosts),
    updatingHosts: PropTypes.instanceOf(Hosts),
};

const mapStateToProps = (state) => {
    const { snack,
            hosts,
            online,
            language,
            selectedHosts,
            updatingHosts } = state;
    const hostsList = hostsMapToList(hosts);
    const mergedHosts = mergeHosts(online, hostsList);
    return {
        snack,
        online,
        language,
        mergedHosts,
        hosts: hostsList,
        updatingHosts: updatingHosts ? hosts[updatingHosts] : null,
        selectedHosts: selectedHosts ? (selectedHosts === MERGED_HOSTS_UID ? mergedHosts : hosts[selectedHosts]) : null,
    };
}

export default connect(mapStateToProps)(App);
