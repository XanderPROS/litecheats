var sanityClient = require('@sanity/client')
var imageUrlBuilder = require('@sanity/image-url')


 const client = sanityClient({
    projectId:process.env.SANITY_PROJECT_ID,
    dataset:'production',
    apiVersion:'2022-03-25',
    useCdn:true,
    token:process.env.SANITY_TOKEN
});

const builder = imageUrlBuilder(client);

const urlFor = (source) => builder.image(source);
module.exports={client,urlFor}