# ------------------------------------------------------------------------------
# Generate build
# ------------------------------------------------------------------------------
FROM node:16-alpine as generator

LABEL stage=generator

WORKDIR /jci

# Install app dependencies
COPY package.json ./
RUN yarn install

# Bundle app source
COPY . .

# Package only Docker version
RUN yarn package:codefresh

# Install production dependencies
#RUN yarn workspaces focus --production
RUN yarn build

# ------------------------------------------------------------------------------
# Second image (release image)
# ------------------------------------------------------------------------------
FROM node:16-alpine

WORKDIR /usr/src/jira-integration

# Now we copy the compiled ncc build folder
COPY --from=generator /jci/dist/codefresh dist
COPY --from=generator /jci/node_modules ./node_modules

CMD ["node", "dist/index.js"]
