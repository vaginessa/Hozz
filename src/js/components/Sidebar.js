import React, { Component, PropTypes } from 'react';
import dragula from 'react-dragula';

import event from '../backend/event';
import Hosts from '../backend/hosts';
import { EVENT, MERGED_HOSTS_UID } from '../constants';

import { addHosts,
         updateHosts,
         removeHosts,
         selectHosts,
         callAddHosts,
         setWholeOnline,
         callUpdateHosts,
         switchHostsPosition } from '../actions/main';

import SearchBox from './SearchBox';
import SidebarItem from './SidebarItem';
import HostsInfoDialog from './HostsInfoDialog';

const getPosition = (element) => {
    return Array.prototype.slice.call(element.parentElement.children).indexOf(element);
}

class Sidebar extends Component {
    constructor(props) {
        super(props);
        this.__dragStartPosition = -1;
        this.__dragEndPosition = -1;
        this.state = {
            isAddingHosts: false,
            isEditingHosts: false,
            nextHosts: { name: '', url: '' },
        }
    }

    componentDidMount () {
        const { dispatch } = this.props;
        const drake = dragula([document.querySelector('.sidebar-list-dragable')]);
        drake.on('drag', (element) => {
            this.__dragStartPosition = getPosition(element);
        });
        drake.on('drop', (element) => {
            this.__dragEndPosition = getPosition(element);
            drake.cancel(true);
        });
        drake.on('cancel', (element) => {
            if (this.__dragStartPosition > -1 && this.__dragEndPosition > -1) {
                dispatch(switchHostsPosition(this.__dragStartPosition, this.__dragEndPosition));
            }
            this.__dragStartPosition = -1;
            this.__dragEndPosition = -1;
        });
    }

    componentWillReceiveProps (nextProps) {
        const { updatingHosts } = nextProps;
        const { isAddingHosts, isEditingHosts } = this.state;
        if (!isAddingHosts && !isEditingHosts && nextProps.updatingHosts) {
            this.setState({
                isEditingHosts: true,
                nextHosts: {
                    url: updatingHosts.url,
                    name: updatingHosts.name,
                },
            });
        }
    }

    __onHostsDialogOKClick () {
        const { dispatch, updatingHosts } = this.props;
        const { isAddingHosts, isEditingHosts, nextHosts } = this.state;
        if (isAddingHosts) {
            nextHosts.name && dispatch(addHosts(new Hosts(nextHosts)));
            dispatch(callAddHosts(''));
        } else if (isEditingHosts) {
            const { uid } = updatingHosts;
            const { name, url } = nextHosts;
            name && dispatch(updateHosts({ uid, name, url }));
            dispatch(callUpdateHosts(''));
        }
        this.setState({
            isAddingHosts: false,
            isEditingHosts: false,
            nextHosts: { url: '', name: '' }
        });
    }

    __onHostsDialogAddClick () {
        this.setState({
            isAddingHosts: true,
            nextHosts: { url: '', name: '' },
        });
    }

    __onDialogInputChange (name, url) {
        this.setState({ nextHosts: { name, url } });
    }

    __onDialogDismiss () {
        const { dispatch } = this.props;
        dispatch(callAddHosts(''));
        dispatch(callUpdateHosts(''));
        this.setState({
            isAddingHosts: false,
            isEditingHosts: false,
            nextHosts: { url: '', name: '' }
        });
    }

    __onSettingsClick () {
        event.emit(EVENT.OPEN_SETTINGS_WINDOW);
    }

    __onItemClick (uid) {
        this.props.dispatch(selectHosts(uid));
    }

    __onItemEdit (uid) {
        this.props.dispatch(callUpdateHosts(uid));
    }

    __onItemRemove (uid) {
        this.props.dispatch(removeHosts(uid));
    }

    __onItemStatusChange (uid, online) {
        const { dispatch, mergedHosts } = this.props;
        if (uid === MERGED_HOSTS_UID) {
            dispatch(setWholeOnline(online));
        } else if (mergedHosts.online) {
            dispatch(updateHosts({ uid, online }))
        }
    }

    __renderSidebarItem (item) {
        const { activeUid } = this.props;
        if (!item) {
            return null;
        }
        const { uid } = item;
        return (<SidebarItem
                    key={ uid }
                    item={ item }
                    active={ activeUid === uid }
                    onClick={ this.__onItemClick.bind(this, uid) }
                    onStatusChange={ this.__onItemStatusChange.bind(this, uid, !item.online) }
                    onEdit={ uid !== MERGED_HOSTS_UID ? this.__onItemEdit.bind(this, uid) : null }
                    onRemove={ uid !== MERGED_HOSTS_UID ? this.__onItemRemove.bind(this, uid): null } />);
    }

    render() {
        const { isAddingHosts, isEditingHosts, nextHosts } = this.state;
        const { list, mergedHosts, updatingHosts, onSearchChange } = this.props;
        const sidebarItems = list.map((item, index) => {
            return this.__renderSidebarItem(item);
        });
        const addHostsButton = isAddingHosts || isEditingHosts ?
                                <i className="iconfont ok" onClick={ this.__onHostsDialogOKClick.bind(this) }>&#xe60a;</i> :
                                <i className="iconfont add" onClick={ this.__onHostsDialogAddClick.bind(this) }>&#xe600;</i>;
        return (<div className="sidebar">
                    <SearchBox className="sidebar-search" onTextChange={ onSearchChange } />
                    <div className="sidebar-list">
                        { this.__renderSidebarItem(mergedHosts) }
                        <div className="sidebar-list-dragable">
                            { sidebarItems }
                        </div>
                    </div>
                    <div className="sidebar-bottom">
                        <div className="actions">
                            { addHostsButton }
                            <i className="iconfont settings" onClick={ this.__onSettingsClick.bind(this) }>&#xe605;</i>
                        </div>
                    </div>
                    { isAddingHosts || isEditingHosts ?
                        <HostsInfoDialog
                            url={ nextHosts ? nextHosts.url : '' }
                            name={ nextHosts ? nextHosts.name : '' }
                            onDismiss={ this.__onDialogDismiss.bind(this) }
                            onInputChange={ this.__onDialogInputChange.bind(this) } /> : null }
                </div>);
    }
}

Sidebar.propTypes = {
    list: PropTypes.array,
    dispatch: PropTypes.func,
    activeUid: PropTypes.string,
    onSearchChange: PropTypes.func,
    mergedHosts: PropTypes.instanceOf(Hosts),
    updatingHosts: PropTypes.instanceOf(Hosts),
};

export default Sidebar;
