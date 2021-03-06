import Ember from 'ember';
import config from 'ember-get-config';

import layout from './template';

/**
 * @module ember-osf
 * @submodule components
 */

/**
 * Support file uploads via dropzone.
 * Accepts dropzone event listeners as parameters (e.g. success, error, addedfile)
 *
 * Sample usage:
 * ```handlebars
 * {{dropzone-widget
 *   preUpload=attrs.preUpload
 *   buildUrl=buildUrl
 *   success=attrs.success
 *   options=dropzoneOptions}}
 * ```
 *
 * @class dropzone-widget
 */
export default Ember.Component.extend({
    layout,
    session: Ember.inject.service(),
    classNames: ['dropzone'],
    didInsertElement() {
        let preUpload = this.get('preUpload');
        let dropzoneOptions = this.get('options') || {};

        if (!this.get('buildUrl') && !preUpload && !dropzoneOptions.url) {
            console.error('Need to define url somewhere');
        }
        let drop = new Dropzone(`#${this.elementId}`, {  // jshint ignore:line
            url: file => typeof this.get('buildUrl') === 'function' ? this.get('buildUrl')(file) : this.get('buildUrl'),
            autoProcessQueue: false,
        });

        // Set osf session header
        let headers = {};

        let authType = config['ember-simple-auth'].authorizer;
        this.get('session').authorize(authType, (headerName, content) => {
            headers[headerName] = content;
        });
        dropzoneOptions.headers = headers;
        dropzoneOptions.withCredentials = (config.authorizationType === 'cookie');

        // Attach preUpload to addedfile event
        drop.on('addedfile', file => {
            if (preUpload) {
                preUpload(this, drop, file).then(() => drop.processFile(file));
            } else {
                drop.processFile(file);
            }
        });

        // Set dropzone options
        drop.options = Ember.merge(drop.options, dropzoneOptions);

        // Attach dropzone event listeners: http://www.dropzonejs.com/#events
        drop.events.forEach(event => {
            if (typeof this.get(event) === 'function') {
                drop.on(event, (...args) => this.get(event)(this, drop, ...args));
            }
        });
    }
});
