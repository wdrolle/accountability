import { Meteor } from 'meteor/meteor';
import { MessagesCollection } from './MessagesCollection';

Meteor.methods({
  'messages.insert'(text, groupId) {
    if (!this.userId) {
      throw new Meteor.Error('Not authorized.');
    }

    return MessagesCollection.insertAsync({
      text,
      groupId,
      createdAt: new Date(),
      userId: this.userId,
    });
  },
}); 