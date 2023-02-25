# Introduction
Plugin that integrates the Shelly devices from Allterco Robotics.<br />

> **NOTE:** This is a work in progress, and not in a final release state!

# Features
- [x] Discover device
- [x] Add endpoints
- [ ] Handle inputs
- [ ] Add Webhooks
- [ ] Add MQTT

# Installation
1) Create a new plugin over the OpenHaus backend HTTP API
2) Upload the *.tgz content to the file upload endpoint
3) Restart the backend & connector

# Links
- https://www.shelly.cloud

# Development
Add plugin item via HTTP API:<br />
[PUT] `http://{{HOST}}:{{PORT}}/api/plugins/`
```json
{
   "_id":"63a073874e8373f8ccdbe4a6",
   "name":"Shelly Devices",
   "version":1,
   "intents":[
      "devices",
      "endpoints",
      "ssdp",
   ],
   "uuid":"7f6320ec-b520-11ed-b637-7b53e7c5e75a"
}
```
Mount the source code into the backend plugins folder
```sh
sudo mount --bind ~/projects/OpenHaus/plugins/oh-plg-shelly/ ~/projects/OpenHaus/backend/plugins/7f6320ec-b520-11ed-b637-7b53e7c5e75a/
```