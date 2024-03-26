import getCrm from "@calcom/app-store/_utils/getCrm";
import logger from "@calcom/lib/logger";
import type { CalendarEvent } from "@calcom/types/Calendar";
import type { CredentialPayload } from "@calcom/types/Credential";
import type { CRM } from "@calcom/types/CrmService";

const log = logger.getSubLogger({ prefix: ["CrmManager"] });
export default class CrmManager {
  crmService: CRM | null | undefined = null;
  credential: CredentialPayload;
  constructor(credential: CredentialPayload) {
    this.credential = credential;
  }

  private async getCrmService(credential: CredentialPayload) {
    if (this.crmService) return this.crmService;
    const response = await getCrm(credential);
    this.crmService = response;

    if (this.crmService === null) {
      console.log("💀 Error initializing CRM service");
      log.error("CRM service initialization failed");
    }
  }

  public async createEvent(event: CalendarEvent) {
    await this.getCrmService(this.credential);
    // First see if the attendees already exist in the crm
    let contacts = await this.getContacts(event.attendees.map((a) => a.email));
    console.log("This was hit");
    // Ensure that all attendees are in the crm
    if (contacts.length == event.attendees.length) {
      await this.crmService?.createEvent(event, contacts);
    } else {
      // Figure out which contacts to create
      const contactsToCreate = event.attendees.filter((attendee) => !contacts.includes(attendee.email));
      const createdContacts = await this.crmService?.createContact(contactsToCreate);
      contacts = contacts.concat(createdContacts);
      await this.crmService?.createEvent(event, contacts);
    }
  }

  public async getContacts(email: string | string[]) {
    await this.getCrmService(this.credential);
    const contacts = await this.crmService?.getContacts(email);
    return contacts;
  }

  public async createContact(email: string) {
    await this.getCrmService(this.credential);
    return;
  }
}
