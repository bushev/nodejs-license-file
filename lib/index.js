/*
 * nodejs-license-file
 * https://github.com/bushev/nodejs-license-file
 *
 * Copyright (c) 2016 Yury Bushev
 * Licensed under the MIT license.
 */

'use strict';

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
const fs = require('fs');

/**
 * Core crypto module
 *
 * @type {exports|module.exports}
 */
const crypto = require('crypto');

/**
 * Deterministic version of JSON.stringify()
 */
const stringify = require('json-stable-stringify');

const dayjs = require('dayjs');
/**
 * LicenseFile Class
 */
class LicenseFile {

    /**
     *  Generate license file
     *
     * @param options
     * @param options.data {object|string} - data to sign
     * @param options.template - custom license file template
     * @param [options.privateKeyPath] {string} - path to private key
     * @param [options.privateKey] {string} - private key content
     */
    static generate(options) {

        let privateKey;

        if (!options.data) {

            throw new Error('LicenseFile::generate: options.data is required');
        }

        if (!options.template) {

            throw new Error('LicenseFile::generate: options.template is required');
        }

        if (typeof options.privateKey === 'string') {

            privateKey = options.privateKey;

        } else if (typeof options.privateKeyPath === 'string') {

            privateKey = fs.readFileSync(options.privateKeyPath, 'utf8');

        } else {

            throw new Error('LicenseFile::generate: privateKeyPath or privateKey is required');
        }

        const serial = LicenseFile._generateSerial(Object.assign({}, options, {privateKey}));

        if (typeof options.data === 'string') {

            options.data = {string: options.data};
        }

        options.data.serial = serial;

        return LicenseFile._render(options.template, LicenseFile._prepareDataObject(options.data));
    }

    /**
     * Parse license file
     *
     * @param options
     * @param options.template - custom license file template
     * @param [options.publicKeyPath] {string} - path to public key
     * @param [options.publicKey] {string} - path to public key
     * @param [options.licenseFilePath] {string} - path to license file
     * @param [options.licenseFile] {string} - license file content
     */
    static parse(options) {

        let publicKey;
        let licenseFile;

        if (!options.template) {

            throw new Error('LicenseFile::parse: options.template is required');
        }

        if (typeof options.publicKey === 'string') {

            publicKey = options.publicKey;

        } else if (typeof options.publicKeyPath === 'string') {

            publicKey = fs.readFileSync(options.publicKeyPath, 'utf8');

        } else {

            throw new Error('LicenseFile::parse: publicKeyPath or publicKey is required');
        }

        if (typeof options.licenseFile === 'string') {

            licenseFile = options.licenseFile;

        } else if (typeof options.licenseFilePath === 'string') {

            licenseFile = fs.readFileSync(options.licenseFilePath, 'utf8');

        } else {

            throw new Error('LicenseFile::parse: licenseFilePath or licenseFile is required');
        }

        const tokens = [];

        const regExpString = options.template.replace(/{{&(\w+)}}/g, (match, token) => {

            tokens.push(token);

            return '(.*)';
        });

        const result = licenseFile.match(new RegExp(regExpString));

        if (!result) {

            throw new Error(`License file corrupted`);
        }

        if (result.length - tokens.length !== 1) {

            throw new Error(`License file corrupted, tokens expected: ${tokens.length}, actual: ${result.length - 1}`);
        }

        const dataObj = {
            data: {}
        };

        for (let i = 0; i < tokens.length; i++) {

            if (tokens[i] === 'serial') {

                dataObj[tokens[i]] = result[i + 1];

            } else {

                dataObj['data'][tokens[i]] = result[i + 1];
            }
        }

        const verify = crypto.createVerify('RSA-SHA256');

        verify.update(stringify(dataObj.data));

        const valid = verify.verify(publicKey, dataObj.serial, 'base64') && LicenseFile._isNotExpired(dataObj);

        return {
            valid: valid,
            serial: dataObj.serial,
            data: dataObj.data
        };
    }

    /**
     *
     * @param options
     * @param options.data
     * @param options.privateKey
     * @private
     */
    static _generateSerial(options) {

        const sign = crypto.createSign('RSA-SHA256');
        let data   = options.data;

        if (typeof options.data === 'object') {

            data = stringify(LicenseFile._prepareDataObject(options.data));
        }

        sign.update(data);

        return sign.sign(options.privateKey, 'base64');
    }

    static _render(template, data) {

        for (let property in data) {

            if (data.hasOwnProperty(property)) {

                const regExp = new RegExp(`{{&${property}}}`, `g`);

                template = template.replace(regExp, data[property]);
            }
        }

        return template;
    }

    static _prepareDataObject(data) {

        const result = {};

        for (let property in data) {

            if (data.hasOwnProperty(property)) {

                result[property] = typeof data[property] === 'string' ? data[property] : data[property] + '';
            }
        }

        return result;
    }

    static _isNotExpired(options) {
        let data   = options.data;

        if (typeof options.data === 'object' && typeof data.expirationDate === 'string') {
            const expirationDate = data.expirationDate;
            const isBefore = dayjs().isBefore(dayjs(expirationDate));
            const isSame = dayjs().isSame(dayjs(expirationDate))
            return isBefore || isSame; 
        }
        return true;
    } 
}

/**
 * Export LicenseFile Class
 *
 * @type {LicenseFile}
 */
module.exports = LicenseFile;
