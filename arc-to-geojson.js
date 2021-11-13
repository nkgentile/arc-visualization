import { default as assert } from 'assert/strict';
import { createReadStream, createWriteStream } from 'fs';
import EventStream from 'event-stream';
const { map } = EventStream;
import reduce from 'stream-reduce';
import { parse, stringify } from 'JSONStream';
import { pipeline } from 'stream/promises';

const args = process.argv;
const jsonFilename = args[2];
assert(jsonFilename?.length > 0 && jsonFilename.endsWith('json'), 'Please provide a path to a JSON file');

await pipeline(
    createReadStream(jsonFilename, { encoding: 'utf8' }),
    parse('timelineItems.*'),
    map(function (item, callback) {
        try {
            if (!Array.isArray(item?.samples) || item?.samples?.length === 0) {
                process.stderr.write(`Skipping item ${item.itemId}\n`);
                callback();
                return;
            }

            const coordinates = item.samples.reduce((coordinates, sample) => {
                if (!(Number.isFinite(sample?.location?.longitude) && Number.isFinite(sample?.location?.latitude))) {
                    process.stderr.write(`Skipping sample ${sample?.sampleId}\n`);
                    return coordinates;
                }

                const { longitude, latitude, altitude } = sample.location;
                coordinates.push([longitude, latitude, altitude]);

                return coordinates;
            }, []);

            const feature = {
                type: "Feature",
                geometry: {
                    type: "MultiLineString",
                    coordinates: [coordinates]
                },
                properties: {}
            };

            callback(null, feature);
        } catch (error) {
            callback(error);
        }
    }),
    reduce((featureCollection, feature) => {
        featureCollection.features.push(feature);
        return featureCollection;
    }, { type: "FeatureCollection", features: [] }),
    stringify('', ',\n', ''),
    process.stdout
)


// If we use `head` downstream it will send an error signal
process.stdout.on('error', process.exit);