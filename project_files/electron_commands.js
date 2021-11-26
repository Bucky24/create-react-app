module.exports = {
	ping: (data) => {
        return {
            message: 'pong',
            data,
        };
	},
}