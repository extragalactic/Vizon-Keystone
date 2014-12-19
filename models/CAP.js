var keystone = require('keystone'),
	Types = keystone.Field.Types;

/**
 * CAP Model
 * ==========
 */

var CAP = new keystone.List('CAP', {
	track: true,
	map: { name: 'ID' },
	autokey: { path: 'slug', from: 'ID missionId ', unique: true }
});

CAP.add({
	ID: { type: String, required: true, match: [/CAP_\d+$/, 'ID Format must be CAP_#'] },
	missionId: { type: Types.Relationship, ref: 'Mission', index: true, many: true, initial: true , required: true},
	name: { type: String, initial : true },
	length: { type: Number, required: true, initial: true },
	package: {type: Types.TextArray, initial: false, length: 6}
});

CAP.schema.pre('save', function(next) {
	cap = this;
	CAP.model.find({'ID' : cap.ID, 'missionId': {$in:cap.missionId}} , function(err, caps) {
		for (var k in caps) {
			if (!caps[k]._id.equals(cap._id)) {
				var err = new Error(cap.ID + ' already exists for one of the specified Missions');
				next(err);
			}
		}
		next();
	});
});

CAP.schema.post('save', function(tap) {
	CAP.model.populate(tap, 'missionId', function(err, data) {
		data = data.toObject();
		for (var k in data.missionId) {
			delete keystone.mongoose.connection.models[data.missionId[k].missionId + '-' + data.ID];
		}
		for (var i in data.missionId) {
			keystone.mongoose.connection.funcs.loadPacketModel(data.missionId[i].missionId + '-' + data.ID);
		}
	});
});

CAP.defaultColumns = 'ID, name, length, missionId|20%';
CAP.register();
