# nodejs-license-file

[![Build Status](https://travis-ci.org/bushev/nodejs-license-file.svg?branch=master)](https://travis-ci.org/bushev/nodejs-license-file)

A lightweight License file generator and parser for NodeJS.

## Generate a keypair using OpenSSL

1. Generate an RSA 2048 bit private key

    `openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048`

2. Extract the public key from an RSA keypair

    `openssl rsa -pubout -in private_key.pem -out public_key.pem`

## Generating license file

```javascript
const licenseFile = require("nodejs-license-file");

const template = [
    "====BEGIN LICENSE====",
    "{{&licenseVersion}}",
    "{{&applicationVersion}}",
    "{{&firstName}}",
    "{{&lastName}}",
    "{{&email}}",
    "{{&expirationDate}}",
    "{{&serial}}",
    "=====END LICENSE====="
].join("\n");

try {
    const licenseFileContent = licenseFile.generate({
        privateKeyPath: "path/to/key.pem",
        template,
        data: {
            licenseVersion: "1",
            applicationVersion: "1.0.0",
            firstName: "Name",
            lastName: "Last Name",
            email: "some@email.com",
            expirationDate: "2025-11-15"
        }
    });

    console.log(licenseFileContent);
} catch (err) {
    console.log(err);
}
```

This will produce a license key, which uses the default template and will look similar to this:

```txt
====BEGIN LICENSE====
1
1.0.0
Name
Last Name
some@email.com
2025-11-15
xxxxxxxxxxxxxxxxxxxxx
=====END LICENSE=====
```

## Parse and verify license file

```javascript
const licenseFile = require("nodejs-license-file");

try {
    const data = licenseFile.parse({
        publicKeyPath: "path/to/key.pub",
        licenseFilePath: "path/to/file.lic",
        template
    });

    console.log(data);
} catch (err) {
    console.log(err);
}
```

There is an execution result:

```json
{
    valid: true,
    serial: 'oZDqoEr2avwhAqwV4HInq9otNzeBeD/azq2yn2jA ...',
    data: {
        licenseVersion: '1',
        applicationVersion: '1.0.0',
        firstName: 'Name',
        lastName: 'Last Name',
        email: 'some@email.com',
        expirationDate: '2025-11-15'
    }
}
```

NOTICE: All numeric data will be converted to strings after parsing. You need to take care of a parsed data types.

## Parse and verify license string

```javascript
const licenseFile = require("nodejs-license-file");

try {
    const licence = `
====BEGIN LICENSE====
1
1.0.0
Name
Last Name
some@email.com
2025-11-15
xxxxxxxxxxxxxxxxxxxxx
=====END LICENSE=====
    `;

    const data = licenseFile.parse({
        publicKeyPath: "path/to/key.pub",
        licenseFile: licence,
        template
    });

    console.log(data);
} catch (err) {
    console.log(err);
}
```

There is an execution result:

```json
{
    valid: true,
    serial: 'oZDqoEr2avwhAqwV4HInq9otNzeBeD/azq2yn2jA ...',
    data: {
        licenseVersion: '1',
        applicationVersion: '1.0.0',
        firstName: 'Name',
        lastName: 'Last Name',
        email: 'some@email.com',
        expirationDate: '2025-11-15'
    }
}
```

NOTICE: All numeric data will be converted to strings after parsing. You need to take care of a parsed data types.
