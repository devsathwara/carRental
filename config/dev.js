// this file is used for development
//odule.exports={
  //  MongoDB: 'mongodb+srv://<carrental>:<Devsathwara08@>@carrental.mz7hz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'
//};
module.exports={
   AWSAccessID : 'AKIAVHK7QWEAG5AI7LRX',
  AWSSecretKey : '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',
  StripePublishableKey : 'pk_test_51KhsFRCb4rRrHPlDrkjTQSrzWE6mdXHjxIsgQ6rWo5kLQqoYtnXqtdD338qatwxwfK2cxJpGyfJgysNxqxwFEV2h00kQ50mAUH',
  StripeSecretKey : 'sk_test_51KhsFRCb4rRrHPlDIDqCtAaldwpHQJ285aJy8dP9wbPZ1K8zCLJQdR7TR94GhoQpPMsBZYmbDxiu5dxPesj6XG9500xf03a4aU'
};
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = 'mongodb+srv://<carrental>:<VYOFfKPi6XYOLJN4>@carrental.mz7hz.mongodb.net/prodb?retryWrites=true&w=majority';
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});
