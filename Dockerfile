FROM node:21

WORKDIR /app
COPY package*.json .

# ARG NODE_ENV
# RUN if [ "$NODE_ENV" = "production" ]; \
#         then npm install --only=production; \
#         elese npm install; \
#         fi

RUN npm install

COPY . ./

ENV PORT=3000
EXPOSE ${PORT}

CMD [ "npm", "start" ]