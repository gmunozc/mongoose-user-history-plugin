# Mongoose User History Plugin

The Mongoose User History Plugin is designed to provide an extensive and detailed log of all modifications made to documents within a MongoDB collection managed by Mongoose.

This functionality is crucial for applications that require an audit trail or version control of document changes over time. By capturing a comprehensive history of each document's evolution, the plugin facilitates better data management, accountability, and traceability.

[![NPM version](https://badge.fury.io/js/mongoose-user-history-plugin.svg)](http://badge.fury.io/js/mongoose-user-history-plugin) [![NPM Downloads](https://img.shields.io/npm/dm/mongoose-user-history-plugin.svg)](https://www.npmjs.com/mongoose-user-history-plugin)

[![npm](https://nodei.co/npm/mongoose-user-history-plugin.png)](https://www.npmjs.com/package/mongoose-user-history-plugin)

## Getting Started

### Installation

```sh
yarn add mongoose-user-history-plugin
```

or

```sh
npm install mongoose-user-history-plugin
```

Alternatively, you can manually add it to your project's package.json.

### Usage

To begin tracking changes on your collections, simply integrate the mongoose-history plugin into your schema:

```typescript
import mongooseHistory from 'mongoose-user-history-plugin';
import mongoose, { Schema } from 'mongoose';

var PostSchema = new Schema({
  title: String,
  message: String,
});

PostSchema.plugin(mongooseHistory);
```

This integration automatically logs all changes made to the schema.

### Tracking User Modifications

To track the user responsible for changes, first, establish a context in any middleware:

For NestJS:

```typescript
// /src/main.ts
import contextService from 'request-context';

// Creating a NestJS application instance
const app = await NestFactory.create(AppModule);
app.use(contextService.middleware('request'));

// In user.guard.ts or a similar guard
import contextService from 'request-context';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Assuming you get the user information here
    contextService.set('request:userInfo', user._id);
  }
}
```

For Express:

```typescript
import contextService from 'request-context';

// wrap requests in the 'request' namespace
app.use(contextService.middleware('request'));

// set some object from the request object on the context
// to automatically save it when a document changes
app.use(function (req, res, next) {
  contextService.setContext('request:userInfo', req.user._id);
  next();
});
```

Configure the modifiedBy field in your schema to reflect the user making the change. This can be a direct reference or an entire user object:

```typescript
import mongoose, { Types } from 'mongoose';

PostSchema.plugin(mongooseHistory, {
  modifiedBy: {
    schemaType: Types.ObjectId, // Can be String, ObjectId, etc.
    contextPath: 'request:userInfo',
  },
});
```

### Storing Additional Metadata

To include extra data, utilize the metadata option. It accepts an array of objects with key and value parameters. The schema parameter (default {type: mongoose.Schema.Types.Mixed}) can also be specified for mongoose schema options. The value can be a string (extracted from the updated document) or a (sync/async) function:

```typescript
import mongoose, { Types } from 'mongoose';

PostSchema.plugin(mongooseHistory, {
  metadata: [
    { key: 'title', value: 'title' },
    {
      key: 'titleFunc',
      value: function (original, newObject) {
        return newObject.title;
      },
    },
    {
      key: 'titleAsync',
      value: function (original, newObject, cb) {
        cb(null, newObject.title);
      },
    },
  ],
});
```

### Indexes for Enhanced Query Performance

Define indexes to enhance query performance in the history collection:

```typescript
PostSchema.plugin(mongooseHistory, {
  indexes: [{ collectionName: 1, action: 1, documentId: 1, modifiedBy: 1 }],
});
```

## Use Cases

- **Audit Logs:** For applications that need to maintain a record of who changed what and when, the plugin provides a straightforward solution for generating audit logs.
- **Version Control:** In scenarios where it's important to revert documents to previous states or view their evolution over time, the plugin's detailed history records can serve as a version control system.
- **Regulatory Compliance:** For businesses subject to regulatory requirements around data management and change logging, the plugin helps in maintaining compliance by ensuring that all document modifications are recorded and attributable to specific users.
- **Collaborative Editing:** In applications where documents are collaboratively edited by multiple users, the plugin enables tracking of individual contributions and changes, simplifying the process of reviewing and managing edits.

## Key Features

- **Document Change Tracking:** Every time a document is updated, created, or deleted, the plugin records the changes in a separate history collection. This includes modifications to document fields, addition or removal of fields, and changes to nested objects within the document.
- **User Attribution:** In addition to tracking changes, the plugin can also store information about the user responsible for each modification. This is particularly useful for applications with multiple users or editors, where understanding who made specific changes is critical for accountability and auditing purposes.
- **Customizable History Storage:** The plugin allows for customization of how and where the history data is stored. Developers can specify the structure of the history records, including which fields are recorded and how user information is captured. This flexibility ensures that the history data can be tailored to meet the specific needs of the application.
- **Seamless Integration:** Designed to work seamlessly with Mongoose, the plugin can be easily added to existing schemas with minimal configuration. Once integrated, it operates in the background, automatically capturing document changes without requiring additional code for each CRUD operation.
- **Support for Complex Documents:** The plugin is capable of handling complex documents, including those with nested objects and arrays. It intelligently tracks changes at all levels of the document structure, ensuring that even granular modifications are captured accurately.

# LICENSE

This project is licensed under the BSD 3-Clause "New" or "Revised" License. See the [LICENSE](/LICENCE) file for more details.
