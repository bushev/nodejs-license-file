'use strict';

/**
 * Should library
 *
 * @type {should|exports|module.exports}
 */
const should = require('should');

/**
 * Core fs module
 *
 * @type {exports|module.exports}
 */
const fs = require('fs');

/**
 * LicenseFile module
 *
 * @type {Generator|exports|module.exports}
 */
const licenseFile = require('../index');

/**
 * Some constants
 */
const LICENSE_VERSION     = '1';
const APPLICATION_VERSION = '1.0.0';
const FIRST_NAME          = 'First Name';
const LAST_NAME           = 'Last Name';
const EMAIL               = 'some@email.com';
const SOME_NUMBER         = 123;
const EXPIRATION_DATE     = '2025-09-25';

const template = [
    '====BEGIN LICENSE====',
    'Ver: {{&licenseVersion}}',
    '{{&applicationVersion}}',
    '{{&firstName}}',
    '{{&lastName}}',
    '{{&email}} - User E-mail',
    '{{&someNumber}}',
    '{{&expirationDate}}',
    'Serial: {{&serial}}',
    '=====END LICENSE====='
].join('\n');

const template2 = [
    '====BEGIN LICENSE====',
    'Ver: {{&licenseVersion}}',
    'Serial: {{&serial}}',
    '=====END LICENSE====='
].join('\n');

describe('Generate license file', () => {

    it('template is required', () => {
        (() => {
            licenseFile.generate({
                privateKeyPath: 'test/keys/private_key.pem',
                data: {
                    licenseVersion: LICENSE_VERSION
                }
            });
        }).should.throw(Error('LicenseFile::generate: options.template is required'));
    });

    it('data is required', () => {
        (() => {
            licenseFile.generate({
                template,
                privateKeyPath: 'test/keys/private_key.pem'
            });
        }).should.throw(Error('LicenseFile::generate: options.data is required'));
    });

    it('privateKey or privateKeyPath is required', () => {
        (() => {
            licenseFile.generate({
                template,
                data: {
                    licenseVersion: LICENSE_VERSION
                }
            });
        }).should.throw(Error('LicenseFile::generate: privateKeyPath or privateKey is required'));
    });

    it('with custom template', done => {

        const fileData = licenseFile.generate({
            template,
            privateKeyPath: 'test/keys/private_key.pem',
            data: {
                licenseVersion: LICENSE_VERSION,
                applicationVersion: APPLICATION_VERSION,
                firstName: FIRST_NAME,
                lastName: LAST_NAME,
                email: EMAIL,
                someNumber: SOME_NUMBER,
                expirationDate: EXPIRATION_DATE
            }
        });

        const regExp = new RegExp('^====BEGIN LICENSE====\\n' +
            'Ver: ' + LICENSE_VERSION + '\\n' +
            APPLICATION_VERSION + '\\n' +
            FIRST_NAME + '\\n' +
            LAST_NAME + '\\n' +
            EMAIL + ' - User E-mail\\n' +
            SOME_NUMBER + '\\n' +
            EXPIRATION_DATE + '\\nSerial: (.*)\\n=====END LICENSE=====$');

        fileData.should.match(regExp);

        fs.writeFileSync('test/1.lic', fileData, 'utf8');

        done();
    });
});

describe('Parse license files', () => {

    it('template is required', () => {
        (() => {
            licenseFile.parse({
                publicKeyPath: 'test/keys/public_key.pem',
                licenseFile: fs.readFileSync('test/1.lic', 'utf8')
            });
        }).should.throw(Error('LicenseFile::parse: options.template is required'));
    });

    it('publicKeyPath or publicKey is required', () => {
        (() => {
            licenseFile.parse({
                template,
                licenseFile: fs.readFileSync('test/1.lic', 'utf8')
            });
        }).should.throw(Error('LicenseFile::parse: publicKeyPath or publicKey is required'));
    });

    it('licenseFilePath or licenseFile is required', () => {
        (() => {
            licenseFile.parse({
                template,
                publicKeyPath: 'test/keys/public_key.pem'
            });
        }).should.throw(Error('LicenseFile::parse: licenseFilePath or licenseFile is required'));
    });

    it('with custom template', done => {

        const data = licenseFile.parse({
            template,
            publicKeyPath: 'test/keys/public_key.pem',
            licenseFile: fs.readFileSync('test/1.lic', 'utf8')
        });

        Object.keys(data).should.deepEqual(['valid', 'serial', 'data']);
        Object.keys(data.data).should.deepEqual(['licenseVersion', 'applicationVersion', 'firstName', 'lastName', 'email', 'someNumber', 'expirationDate']);

        data.valid.should.be.ok();
        data.serial.should.equal('AQWsPDQL8zhZDl20pe2Upt78+VGIcsbU5ImU6zHADEwR0YdEpRxul2evhCSHpNCVghvBh4ROnGqzSGsUHIqxPY+Yjhpj69yTtorxTnNJTD8DHy27mBuWOTjJ4933zFa4kJqZswYnPBnn2lc4wpUUcNYd+bs76UpiucACtuGSBi7I6IgPwU8NM1j0rrlZpPmX1oHYFDVSHNA91ADi9NVkwK21tKr5qNlvxfN3x8B6N50GzmGIYO4jVeuh4fJqUa6FAHoh2NFmTlZ91msSSv6IZ0erVr5eXKydrkqwzcnVe3VWwCptaa9BCb35zE2YzT+M7/vT92BD2EQMiD725EYJhA==');
        data.data.licenseVersion.should.be.eql(LICENSE_VERSION);
        data.data.applicationVersion.should.be.eql(APPLICATION_VERSION);
        data.data.firstName.should.be.eql(FIRST_NAME);
        data.data.lastName.should.be.eql(LAST_NAME);
        data.data.email.should.be.eql(EMAIL);
        data.data.someNumber.should.be.eql(SOME_NUMBER.toString());
        data.data.expirationDate.should.be.eql(EXPIRATION_DATE);

        done();
    });

    it('lack of placeholders in template', () => {
        (() => {
            licenseFile.parse({
                template: template2,
                publicKeyPath: 'test/keys/public_key.pem',
                licenseFile: fs.readFileSync('test/1.lic', 'utf8')
            });
        }).should.throw(Error('License file corrupted'));
    });

    it('with custom template (bad license file)', done => {

        const data = licenseFile.parse({
            template,
            publicKeyPath: 'test/keys/public_key.pem',
            licenseFile: fs.readFileSync('test/1.lic', 'utf8').replace(/2025\/09\/25/g, '2045/09/25')
        });

        data.valid.should.not.be.ok();

        done();
    });
});

describe('Clean', () => {
    it('license files', done => {
        fs.unlinkSync('test/1.lic');
        done();
    });
});
