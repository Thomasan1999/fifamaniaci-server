export type AggregationExpression = any;
export type BsonType =
    'double'
    | 'string'
    | 'object'
    | 'array'
    | 'binData'
    | 'objectId'
    | 'bool'
    | 'date'
    | 'null'
    | 'regex'
    | 'javascript'
    | 'symbol'
    | 'javascriptWithScope'
    | 'int'
    | 'timestamp'
    | 'long'
    | 'decimal'
    | 'minKey'
    | 'maxKey';

export type Type = 'object' | 'array' | 'number' | 'boolean' | 'string' | 'null';

export type JsonSchemaProperty = {
    additionalItems?: boolean | { [s: string]: JsonSchemaProperty },
    additionalProperties?: boolean | { [s: string]: JsonSchemaProperty },
    allOf: JsonSchemaProperty[]
    anyOf: JsonSchemaProperty[]
    not: JsonSchemaProperty
    oneOf: JsonSchemaProperty[]
    bsonType?: BsonType | BsonType[],
    dependencies?: { [s: string]: JsonSchemaProperty },
    description?: string,
    enum?: any[],
    exclusiveMaximum?: boolean,
    exclusiveMinimum?: boolean,
    items?: { [s: string]: JsonSchemaProperty },
    maximum?: number,
    maxItems?: number,
    maxLength?: number,
    maxProperties?: number,
    minimum?: number,
    minItems?: number,
    minLength?: number,
    minProperties?: number,
    multipleOf?: number,
    pattern?: string,
    patternProperties?: { [s: string]: string },
    properties?: { [s: string]: JsonSchemaProperty },
    required?: string[],
    title?: string,
    type?: Type | Type[],
    uniqueItems?: boolean
};

export type JsonSchema = JsonSchemaProperty;

export type FindQuery = {
    $and: FindQuery[],
    $exists?: boolean,
    $eq?: any,
    $expr?: AggregationExpression,
    $gt?: any,
    $gte?: any,
    $in?: any[],
    $jsonSchema?: JsonSchema,
    $lt?: any,
    $lte?: any,
    $mod?: [number, number],
    $ne?: any,
    $nin?: any[],
    $nor?: FindQuery[],
    $not?: FindQuery,
    $options?: string,
    $or?: FindQuery[],
    $regex?: RegExp,
    $text?: {
        $search: string,
        $language?: string,
        $caseSensitive?: boolean,
        $diacriticSensitive?: boolean
    },
    $type?: BsonType | BsonType[],
    $where: Function | string
};

export type CollectionInfos = {
    name: string,
    options: {
        validationLevel: string, validationAction: string, validator: {
            $jsonSchema: JsonSchema
        }
    },
    type: 'collection'
};
