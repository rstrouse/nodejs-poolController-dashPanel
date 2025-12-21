import * as express from "express";
import { ApiError } from '../Errors';
import { UploadRoute, BackgroundUpload } from "../upload/upload";
import { Client } from "node-ssdp";
import { config } from "../config/Config";
import { logger } from "../logger/Logger";
import { MessageDocs } from "../messages/messages";
import { outQueues } from "../queues/outboundQueue";
import * as extend from 'extend';

export class MessagesRoute {
    public static initRoutes(app: express.Application) {
        app.put('/messages/queue', async (req, res, next) => {
            try {
                console.log(`request:  ${JSON.stringify(req.body)}...`);
                let queue = await outQueues.saveQueue(req.body);
                return res.status(200).send(queue);
            }
            catch (err) {
                next(err);
            }
        });
        app.get('/messages/queue/:id', (req, res, next) => {
            try {
                console.log(`Getting Queue request:  ${JSON.stringify(req.params)}...`);
                let id = parseInt(req.params.id, 10);
                let queue = outQueues.find(q => { return q.id === id });
                if (typeof queue === 'undefined') next(new ApiError(`Outbound queue id:${id} not found.`, 100, 404));
                let out = extend(true, {}, queue);
                out.messages = queue.loadMessages();
                return res.status(200).send(out);
            }
            catch (err) { next(err); }
        });
        app.get('/messages/queues', async (req, res, next) => {
            try {
                outQueues.loadDescriptors();
                console.log(`request:  ${JSON.stringify(req.body)}...`);
                return res.status(200).send(outQueues);
            }
            catch (err) {
                next(err);
            }
        });
        app.get('/messages/docs/constants', (req, res, next) => {
            try {
                return res.status(200).send(MessageDocs.getConstants());
            }
            catch (err) {
                next(err);
            }

        });
        app.get('/messages/docs/keyBytes', (req, res, next) => {
            try {
                return res.status(200).send(MessageDocs.getKeyBytes());
            }
            catch (err) {
                next(err);
            }
        });
        app.get('/messages/docs/entityFlow', (req, res, next) => {
            try {
                return res.status(200).send(MessageDocs.getEntityFlow());
            }
            catch (err) {
                next(err);
            }
        });
        app.get('/messages/docs/:key', (req, res, next) => {
            try {
                return res.status(200).send(MessageDocs.findMessageByKey(req.params.key) || { docKey: req.params.key });
            }
            catch (err) {
                next(err);
            }
        });
    }
}