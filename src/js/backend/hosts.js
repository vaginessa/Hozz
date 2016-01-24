const path = require('path');
import UID from 'uid';

import io from './io';
import log from './log';
import Lang from './language';
import { HOSTS_COUNT_MATHER,
         MERGED_HOSTS_UID,
         WORKSPACE } from '../constants';

const countRules = (text) => {
    let ret = null;
    let count = 0;
    while ((ret = HOSTS_COUNT_MATHER.exec(text)) !== null) {
        count++;
    }
    return count;
}

class Hosts {
    constructor (options) {
        const { index, uid, name, online, url, count, text } = options;
        this.index  = index || 0;
        this.uid    = uid || UID(16);
        this.url    = url || '';
        this.name   = name || '';
        this.count  = count || 0;
        this.online = online || false;
        if (uid === MERGED_HOSTS_UID) {
            this.text = text;
        } else {
            this.setText(text || '');
        }
        this.__syncing = false;
    }

    toObject () {
        const obj = {};
        for (let key in this) {
            if (this.hasOwnProperty(key) && key.slice(0, 2) !== '__' && key !== 'text') {
                if (key === 'online' && typeof(this.__online) !== 'undefined') {
                    obj[key] = this.__online;
                } else {
                    obj[key] = this[key];
                }
            }
        }
        return obj;
    }

    setText (text) {
        this.text = text;
        this.count = countRules(text);
    }

    isSyncing () {
        return this.__syncing;
    }

    setSyncing (syncing) {
        this.__syncing = syncing;
    }

    stashStatus () {
        if (typeof(this.__online) === 'undefined') {
            this.__online = this.online;
            this.online = false;
        }
    }

    popStatus () {
        if (typeof(this.__online) !== 'undefined') {
            this.online = this.__online;
            delete this.__online;
        }
    }

    save () {
        if (!this.uid || this.uid === MERGED_HOSTS_UID) {
            return Promise.resolve();
        }
        return io.writeFile(path.join(WORKSPACE, this.uid), this.text);
    }

    remove () {
        if (!this.uid || this.uid === MERGED_HOSTS_UID) {
            return Promise.resolve();
        }
        return io.unlink(path.join(WORKSPACE, this.uid));
    }

    load () {
        if (this.uid && this.uid !== MERGED_HOSTS_UID) {
            return io.readFile(path.join(WORKSPACE, this.uid), 'utf-8').then((text) => {
                this.setText(text);
                return Promise.resolve();
            }).catch(log);
        } else {
            return Promise.resolve();
        }
    }
}

Hosts.createFromText = (text) => {
    return new Hosts({
        text,
        url: '',
        online: false,
        name: Lang.get('common.untitled_hosts'),
    });
}

export default Hosts;