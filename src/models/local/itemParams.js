import SFJS from "../../lib/sfjs";

var _ = require('lodash')

export default class ItemParams {

  constructor(item, keys, version) {
    this.item = item;
    this.keys = keys;
    this.version = version;
  }

  async paramsForExportFile() {
    this.additionalFields = ["updated_at"];
    this.forExportFile = true;
    this.omit = ["deleted"];
    return this.__params();
  }

  async paramsForExtension() {
    return this.paramsForExportFile();
  }

  async paramsForLocalStorage() {
    this.additionalFields = ["updated_at", "dirty", "errorDecrypting"];
    this.forExportFile = true;
    return this.__params();
  }

  async paramsForSync() {
    return this.__params();
  }

  async __params() {

    var params = {uuid: this.item.uuid, content_type: this.item.content_type, deleted: this.item.deleted, created_at: this.item.created_at};
    if(!this.item.errorDecrypting) {
      if(this.keys && !this.item.doNotEncrypt()) {
        var encryptedParams = await SFJS.itemTransformer().encryptItem(this.item, this.keys, this.version);
        _.merge(params, encryptedParams);

        if(this.version !== "001") {
          delete params.auth_hash;
        }
      }
      else {
        params.content = this.forExportFile ? this.item.createContentJSONFromProperties() : "000" + await SFJS.crypto().base64(JSON.stringify(this.item.createContentJSONFromProperties()));
        if(!this.forExportFile) {
          delete params.auth_hash;
          delete params.enc_item_key;
        }
      }
    } else {
      // Error decrypting, keep "content" and related fields as is (and do not try to encrypt, otherwise that would be undefined behavior)
      params.content = this.item.content;
      params.enc_item_key = this.item.enc_item_key;
      params.auth_hash = this.item.auth_hash;
    }

    if(this.additionalFields) {
      _.merge(params, _.pick(this.item, this.additionalFields));
    }

    if(this.omit) {
      params = _.omit(params, this.omit);
    }

    return params;
  }


}
