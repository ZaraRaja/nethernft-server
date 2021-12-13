const router = require('express').Router();
const User = require('../model/User');
const bcrypt = require('bcryptjs');
const File = require('../model/File');
const uploadMulter = require('../middlewares/upload');
// const InfluencerImageUpload = require("../middlewares/influencerUpload");
const jwt = require('jsonwebtoken');
const Influencer = require('../model/Influencer');
const Launchpad = require('../model/Launchpad');
const NFT = require('../model/Nft');
const NftUser = require('../model/User');
const multer = require('multer');
const path = require('path');
const influencerUpload = require('../middlewares/influencerUpload');
const launchPadpage = require('../middlewares/launchPadpage');
const services = require('../Services/Crud');

// add influencer user
router.post('/influencer', async (req, res) => {
  console.log('Influencer', req.body);
  try {
    const nftUser = await NftUser.findByIdAndUpdate(
      req.body.userId,
      { $set: { isRequested: true } },
      { new: true }
    );
    console.log(nftUser);

    if (nftUser.isRequested) {
      const influencer = new Influencer(req.body);
      const savedInfluencer = await influencer.save();
      res.status(200).json(savedInfluencer);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// ImageUpload for Influencer

router.post('/influencer/imageUpload', influencerUpload, async (req, res) => {
  try {
    console.log(req.body);
    console.log(req.files['profileImage'][0]);
    console.log(req.files['coverImage'][0]);
    res.status(200).send({
      profileImage: req.files['profileImage'][0].path,
      coverImage: req.files['coverImage'][0].path,
    });
  } catch (err) {
    console.log(err);
  }
});

//photo uploading for launchpad page

//Launchpage
router.post('/launchpad', launchPadpage, async (req, res) => {
  try {
    const Launchpage = new Launchpad({
      ...req.body,
      launchcover: req.files['launchCover'][0].path,
    });
    const savedLaunchpage = await Launchpage.save();
    res.status(200).json(savedLaunchpage);
  } catch (err) {
    console.log(err);
  }
});

//Approved from Admin
router.post('/approve', async (req, res) => {
  try {
    const nftUser = await NftUser.findByIdAndUpdate(
      req.body.userId,
      { $set: { isInfluencer: true } },
      { new: true }
    );
    if (nftUser.isInfluencer) {
      res.status(200).send(nftUser);
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//Register the user
router.post('/register', async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    const newUser = new User({
      username: username,
      email: email,
      password: hash,
    });

    const savedUser = await newUser.save();
    res.status(200).json(savedUser);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//Login the user
router.post('/login', async (req, res) => {
  try {
    // const {email,password} = req.body
    const email = req.body.email;
    const password = req.body.password;
    const useremail = await User.findOne({ email: email });
    console.log(useremail);
    let originalText = bcrypt.compareSync(password, useremail.password);
    console.log(originalText);
    console.log(password);
    if (originalText) {
      // const accessToken = jwt.sign({id:useremail.id , useremail:useremail},"MySecretKey")
      // res.status(200).send({message:"user successfully login",
      //   useremail:useremail,
      //   accessToken
      // })

      res
        .status(200)
        .send({ message: 'user successfully login', useremail: useremail });
    } else {
      res.status(404).send({ message: 'password not matching' });
    }
  } catch (error) {
    res.status(500).send({ message: 'Invalid Email' });
  }
});

//Get Users
router.get('/getusers', async (req, res) => {
  try {
    const details = await User.find();
    console.log('Inside user api', details);
    res.status(200).send({ message: 'User get details successfully', details });
  } catch (error) {
    res.status(500).send({ message: error });
  }
});
//get the data of nfts
router.get('/getnfts', async (req, res) => {
  try {
    const Nfts = await NFT.find();
    // console.log("NFT User",Nfts)
    res.status(200).send({ message: 'User get details successfully', Nfts });
  } catch (error) {
    res.status(500).send({ message: error });
  }
});

router.get('/getHashFiles', async (req, res) => {
  try {
    // const files = await File.find();
    console.log('Inside method', req.body);

    const _list = await services.getList(File, {}, {});
    res.send({ success: true, data: _list });
    console.log('List data', _list);
  } catch (err) {
    res.status(500).json(err);
  }
});

//Get user details
router.get('/:id', async (req, res) => {
  try {
    const details = await User.findOne({ _id: req.params.id });
    res.status(200).send(details);
  } catch (error) {
    res.status(500).send({ message: error });
  }
});

// Saving NFT Data
router.post('/mint-nft', async (req, res) => {
  try {
    const new_nft = new NFT({
      ...req.body,
    });
    const saved_nft = await new_nft.save();
    res.status(200).json(saved_nft);
  } catch (err) {
    console.log(err);
  }
});

//saving filepath and hash
router.post('/file', uploadMulter, async (req, res) => {
  try {
    const filepath = req.file.path;
    console.log(filepath);
    const hash = req.body.hash;
    const UserFile = new File({
      filepath: filepath,
      hash: hash,
    });

    const savedFile = await UserFile.save();
    res.status(200).json(savedFile);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

//get files routes
// router.get("/files", async (req, res) => {
//   try {
//     const files = await File.find();
//     console.log(files);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

// router.get("/gethashfile", async (req, res) => {
//   try {
//     // const files = await File.find();
//     console.log("Inside method", req.body);

//     const _list=   await services.getList(File, {}, {});
//     res.send({ success: true, data: _list });
//       console.log("List data", _list)
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

//follow and following
// router.put('/follow',(req,res)=>{
//   User.findByIdAndUpdate(req.body.followId,{
//     $push:{followers:req.user._id}
//   },{
//     new:true
//   },(err,result) =>{
//     if(err){
//       return res.status(422).json({error:error})
//     }
//     User.findByIdAndUpdate(req.user._id,{
//       $push:{following:req.body.followId}
//     } , {new:true}).then(result =>{
//       res.json(result)
//     }).catch(err=>{
//       return res.status(422).json({error:err})
//     })
//   })

// })

//unfollow
// router.put('/following',(req,res)=>{
//   User.findByIdAndUpdate(req.body.unfollowId,{
//     $pull:{followers:req.user._id}
//   },{
//     new:true
//   },(err,result) =>{
//     if(err){
//       return res.status(422).json({error:error})
//     }
//     User.findByIdAndUpdate(req.user._id,{
//       $pull:{following:req.body.unfollowId}
//     } , {new:true}).then(result =>{
//       res.json(result)
//     }).catch(err=>{
//       return res.status(422).json({error:err})
//     })
//   })

// })

module.exports = router;
