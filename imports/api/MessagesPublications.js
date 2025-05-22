import { Meteor } from 'meteor/meteor';
import { MessagesCollection } from './MessagesCollection';

Meteor.publish('messages', function (groupId) {
  const userId = this.userId;
  if (!userId) {
    return this.ready();
  }
  return MessagesCollection.find({ groupId }, {
    sort: { createdAt: -1 },
    limit: 50
  });
}); 