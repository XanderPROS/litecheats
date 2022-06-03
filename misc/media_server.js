require('dotenv').config();
const NodeMediaServer=require('node-media-server'),
      config=require('../config/default').rtmp_server;

nms=new NodeMediaServer(config);

nms.on('prePublish', async (id, StreamPath, args) => {
    let stream_key = getStreamKeyFromStreamPath(StreamPath);
    console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    if(stream_key !== process.env.STREAM_KEY){
        let session = nms.getSession(id);
        session.reject()
    }else{
        
    }
});
 
const getStreamKeyFromStreamPath = (path) => {
    let parts = path.split('/');
    return parts[parts.length - 1];
};
 
module.exports = nms;
