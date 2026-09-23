import { XMLString } from "../services/xml-tag-service/helper-types/xml-string";

export interface MessagingNavbarObject { type: MessagingNavbarTypes; info?: string; state: MessagingState; }
export type MessagingNavbarTypes = 'spinner' | 'success' | 'fail';
export type MessagingState = 'info' | 'success' | 'warning' | 'danger';

export function createHtml(val: MessagingNavbarObject): XMLString<'span'> {
    const icon = function(type: MessagingNavbarTypes): XMLString<'span' | 'i'> {
        switch(val.type) {
            case 'spinner':
                return `<span class="spinner-border spinner-border-sm" role="status">
                            <span class="sr-only"></span>
                        </span>`;
            case 'success':
                return `<i class="bi bi-check-lg"></i>`;
            case 'fail':
                return `<i class="bi bi-x-lg"></i>`;
        }
    }
    const span = function(content: string): XMLString<'span'> {
        return `<span class="badge badge-${val.state} bg-${val.state} my-auto">${content}</span>`
    }
    if (val.info) {
        return span(`${icon(val.type)} ${val.info}`);
    }
    return span(icon(val.type));
}