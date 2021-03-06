/*
 * Copyright 2012-2013 the original author or authors
 * @license MIT, see LICENSE.txt for details
 *
 * @author Scott Andrews
 */

(function (buster, define) {
	'use strict';

	var assert, refute, fail;

	assert = buster.assert;
	refute = buster.refute;
	fail = buster.assertions.fail;

	function StubStream() {}
	StubStream.prototype = {
		on: function (type, handler) {
			this[type] = handler;
		}
	};

	define('msgs/adapters/nodeStream-test', function (require) {

		var msgs, bus;

		msgs = require('msgs/adapters/nodeStream');

		buster.testCase('msgs/adapters/nodeStream', {
			setUp: function () {
				bus = msgs.bus();
			},
			tearDown: function () {
				bus.destroy();
			},

			'should receive data events as messages with inboundNodeStreamAdapter': function (done) {
				var stream, data;

				stream = new StubStream();
				bus.channel('messages');
				bus.inboundNodeStreamAdapter(stream, { output: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(data, payload);
					done();
				}, { input: 'messages' });

				data = {};
				stream.data(data);
			},
			'should write messages to the stream with outboundNodeStreamAdapter': function () {
				var stream, data;

				stream = new StubStream();
				stream.write = this.spy();
				bus.channel('messages');
				bus.outboundNodeStreamAdapter(stream, { input: 'messages' });

				data = {};
				bus.send('messages', data);

				assert.calledWith(stream.write, data);
			},
			'should write messages to the stream until closed': function () {
				var stream, data;

				stream = new StubStream();
				stream.write = this.spy();
				bus.channel('messages');
				bus.outboundNodeStreamAdapter(stream, { input: 'messages' });

				data = ['a', 'b', 'c'];
				bus.send('messages', data[0]);
				bus.send('messages', data[1]);
				stream.close();
				bus.send('messages', data[2]);

				assert.equals([data[0]], stream.write.getCall(0).args);
				assert.equals([data[1]], stream.write.getCall(1).args);
				refute(stream.write.getCall(2));
			},
			'should bridge sending and receiving data': function () {
				var stream, data;

				stream = new StubStream();
				stream.write = this.spy();
				bus.channel('messages');
				bus.nodeStreamGateway(stream, { input: 'messages', output: 'messages' });

				data = 'echo';
				stream.data(data);

				assert.calledWith(stream.write, data);
			},
			'should pass stream error events': function (done) {
				var stream, data;

				stream = new StubStream();
				bus.channel('messages');
				bus.nodeStreamGateway(stream, { error: 'messages' });

				bus.outboundAdapter(function (payload) {
					assert.same(data, payload);
					done();
				}, { input: 'messages' });

				data = 'uh oh';
				stream.error(data);
			}
		});

	});

}(
	this.buster || require('buster'),
	typeof define === 'function' && define.amd ? define : function (id, factory) {
		var packageName = id.split(/[\/\-]/)[0], pathToRoot = id.replace(/[^\/]+/g, '..');
		pathToRoot = pathToRoot.length > 2 ? pathToRoot.substr(3) : pathToRoot;
		factory(function (moduleId) {
			return require(moduleId.indexOf(packageName) === 0 ? pathToRoot + moduleId.substr(packageName.length) : moduleId);
		});
	}
	// Boilerplate for AMD and Node
));
