const express = require("express");
const redis = require("redis");
const sharp = require("sharp");
var fs=require('fs'), PNG=require('pngjs').PNG;

const app = express();
const port = 3000;
let redisClient;
// Create a Redis client
(async () => {
    redisClient = redis.createClient();
  
    redisClient.on("error", (error) => console.error(`Error : ${error}`));
  
    await redisClient.connect();
  })();
// Use middleware to parse request body as JSON
app.use(express.json());

// Handle POST requests to add a pixel to an image and store it in Redis
app.post("/add-pixel", async (req, res) => {
  const { imageName, x, y, value } = req.body; // Assuming the request includes imageName, x, y, and value
  const png = new PNG({ width: 1, height: 1 });

  // Set the pixel color
  png.data[0] = value;  // Red
  png.data[1] = value;    // Green
  png.data[2] = value;    // Blue
  png.data[3] = 0; 
  // Retrieve the image data from Redis
 redisClient.get(imageName, async (err, imageData) => {
    if (err) {
      console.error("Error retrieving image:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!imageData) {
      try {
        
        //fs.createReadStream("in.png")
        const sharpImage1 = sharp("./empty.png");
        sharpImage1
          .composite([{input:/*png*/Buffer.from([value, value, value]), raw:{top: y, left: x }}])
          .toBuffer(async (err, modifiedImageData) => {
            if (err) {
              console.error("Error adding pixel:", err);
              return res.status(500).json({ error: "Internal Server Error" });
            }

            // Store the modified image data back in Redis
            redisClient.set(imageName, modifiedImageData, (err) => {
              if (err) {
                console.error("Error updating image:", err);
                return res.status(500).json({ error: "Internal Server Error" });
              }

              return res
                .status(200)
                .json({ message: "Pixel added to image and updated in Redis" });
            });
          });
      } catch (error) {
        console.error("Error processing image:", error);
        return res.status(500).json({ error: "Image processing error" });
      }
    } else {
      try {
        // Convert the image data to a sharp image

        // Add a pixel to the image at the specified x, y coordinates
        sharp(imageData)
          .composite([{input:png/*Buffer.from([value, value, value])*/, raw:{top: y, left: x} }])
          .toBuffer(async (err, modifiedImageData) => {
            if (err) {
              console.error("Error adding pixel:", err);
              return res.status(500).json({ error: "Internal Server Error" });
            }

            // Store the modified image data back in Redis
            redisClient.set(imageName, modifiedImageData, (err) => {
              if (err) {
                console.error("Error updating image:", err);
                return res.status(500).json({ error: "Internal Server Error" });
              }

              return res
                .status(200)
                .json({ message: "Pixel added to image and updated in Redis" });
            });
          });
      } catch (error) {
        console.error("Error processing image:", error);
        return res.status(500).json({ error: "Image processing error" });
      }
    } 
  });

//redisClient.set(imageName,JSON.stringify([x,y]));
//res.status(200).json({message:"logged data"})
}

);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
