import { Prisma } from '@prisma/client';

export type Note = Prisma.agents_group_noteGetPayload<{
  include: {
    user: true;
    agents_group_note_replies: {
      include: {
        user: true;
      }
    }
  }
}>;

export type Reply = Prisma.agents_group_note_replyGetPayload<{
  include: {
    user: true;
  }
}>; 