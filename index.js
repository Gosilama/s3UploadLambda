import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Buffer } from 'buffer';
import { fileTypeFromBuffer } from 'file-type';

const client = new S3Client({ region: "us-east-1" });

export const handler = async (event, context) => {
    const { base64String } = JSON.parse(event.body);
    const buffer = Buffer.from(base64String, 'base64');

    let mime;
    try {
        ({ mime } = await fileTypeFromBuffer(buffer));
    }catch (e) {
        console.log(e);
        return context.fail("error getting mime from file");
    }

    if (mime == null) {
        return context.fail("invalid file type supplied");
    }

    const { key } = event.pathParameters;

    const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: buffer,
        // ACL: 'public-read',
        ContentEncoding: 'base64',
        ContentType: mime,
    };

    try {
        await client.send(new PutObjectCommand(params));
    } catch (e){
        return context.fail(e.message);
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            url: `${process.env.BUCKET_PATH}/${key}`,
        }),
    }
}
