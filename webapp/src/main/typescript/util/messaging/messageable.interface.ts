import { MessagingHandler } from "./messaging.handler";

export interface Messageable {
    getMessagingHandler(): MessagingHandler;
}