
all: lines
	node index.js senselogs
	node index.js pino

lines:
	echo SenseLogs ; cat node_modules/senselogs/dist/mjs/* | wc -l
	echo Pino ; cat node_modules/pino/lib/* node_modules/pino/pino.js | wc -l


