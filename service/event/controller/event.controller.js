const util = require("../../../utils/response");
const { ObjectId } = require("mongodb");
const moment = require("moment");
const UploadHandler = require("../../upload/controller/upload.controller");
const EventModel = require("../model/event.model");
const UserModel = require("../../user/model/user.model");
const UserSchema = require("../../user/model/user.schema");
const EventSchema = require("../../event/model/event.schema");
const ChatRoomModel = require("../../chat/model/chat.model");
const uploadHelper = require("../../../utils/upload");
const NotificationModel = require("../../user/model/notification.model");
const MemorySchema = require("../model/memory.schema");
const CONSTANTS = require("../../../config/constant");
const LikesModel = require("../../event/model/likes.model");
const FirebaseTokenModel = require("../../user/model/firebase_token.model");
const pushNotification = require("../../../utils/push-notification");
const {
  notifyUsersInEvent,
  notifySingleUserInEvent,
} = require("../../../utils/notifyUserInEvent");
const eventModel = require("../model/event.model");
let io;
class EventHandler {
  setIO(socketIOInstance) {
    io = socketIOInstance;
  }
  //event related functions
  async createEvent(request, response) {
    try {
      let insObj = {};
      insObj.created_by = new ObjectId(request.user._id);

      if (request.body.name) {
        insObj.name = request.body.name.trim();
      } else {
        return response.status(400).json(util.error({}, "Name is required"));
      }
      if (request.body.event_type) {
        insObj.event_type = request.body.event_type.trim();
      } else {
        return response
          .status(400)
          .json(util.error({}, "Event type is required"));
      }
      if (request.body.event_visibility) {
        const allowedValues = ["public", "private", "friends"];
        if (allowedValues.includes(request.body.event_visibility.trim())) {
          insObj.event_visibility = request.body.event_visibility.trim();
        } else {
          return response
            .status(400)
            .json(
              util.error(
                {},
                "Invalid event visibility value. Allowed values are 'public', 'private', 'friends'."
              )
            );
        }
      } else {
        return response
          .status(400)
          .json(util.error({}, "Event visibility is required"));
      }

      if (request.body.description) {
        insObj.description = request.body.description;
      }
      let participants = [];
      participants.push(new ObjectId(request.user._id));
      if (
        request.body.participants &&
        Array.isArray(request.body.participants)
      ) {
        participants = participants.concat(
          request.body.participants.map(
            (participantId) => new ObjectId(participantId)
          )
        );
      } else {
        return response
          .status(400)
          .json(
            util.error({}, "Participants is required and must be an array")
          );
      }
      if (participants.length > 0) {
        insObj.participants = participants;
      }

      if (request.body.start_date && request.body.end_date) {
        const startDate = moment(
          request.body.start_date,
          "YYYY-MM-DDTHH:mm:ss",
          true
        );
        const endDate = moment(
          request.body.end_date,
          "YYYY-MM-DDTHH:mm:ss",
          true
        );

        if (startDate.isValid() && endDate.isValid()) {
          if (startDate.isAfter(endDate)) {
            return response
              .status(400)
              .json(util.error({}, "Start date must be before end date"));
          } else {
            insObj.start_date = startDate.toDate();
            insObj.end_date = endDate.toDate();
          }
        } else {
          console.error("Invalid date format");
        }
      }

      if (request.body.event_image) {
        insObj.event_image = request.body.event_image;
      }

      if (request.body.location) {
        insObj.location = request.body.location;
      }

      const event = await EventModel.createEvent(insObj);
      const eventDetails = await EventModel.getEventById(
        event._id,
        request.user._id
      );

      const chatObj = {
        name: request.body.name,
        created_by: new ObjectId(request.user._id),
        participants: participants,
        event_id: event._id,
      };
      const chatRoom = await ChatRoomModel.createChatRoom(chatObj);
      //emitting event creation event to all participants
      event.participants.forEach((participant) => {
        const socket_room = `my_events/${participant.toString()}`;
        io.to(socket_room).emit("event_update", eventDetails[0]);
      });
      let filteredParticipants = participants.filter(
        (participantId) =>
          participantId.toString() !== request.user._id.toString()
      );
      let participantTokens = await FirebaseTokenModel.findByKey({
        user_id: { $in: filteredParticipants },
        is_deleted: false,
      });
      const user = await UserSchema.findOne(
        { _id: event.created_by },
        "user_name"
      );
      if (participantTokens && participantTokens.length > 0) {
        let notificationData = {
          tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
          title: `You've been added to ${insObj.name}`,
          body: `${user.user_name} added you to ${insObj.name}!Dive in and start sharing your moments with your friends`,
          data: {
            type: "Event Invitation",
            event_id: event._id.toString(),
          },
        };
        let notificationResult = await pushNotification.sendMulticast(
          notificationData
        );
      }

      return response
        .status(200)
        .json(util.success(event, "Event created successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || "Event creation failed"));
    }
  }

  async getEventById(request, response) {
    try {
      const eventId = request.params.event_id;
      const event = await EventModel.getEventById(eventId, request.user._id);
      console.log(event);
      return response
        .status(200)
        .json(util.success(event, "Event fetched successfully"));
    } catch (error) {
      response
        .status(400)
        .json(util.error({}, "error fetching the event", error));
    }
  }

  async deleteEvent(request, response) {
    try {
      let event_id;
      if (request.body.event_id) {
        event_id = new ObjectId(request.body.event_id);
      }

      let getEventData = await EventModel.getEvent(event_id);
      let delEvent;
      if (getEventData && getEventData._id) {
        delEvent = await EventModel.deleteEvent(event_id);
        if (delEvent && delEvent.deletedCount > 0) {
          let deleteMemories = await EventModel.deleteMemories({
            event_id: event_id,
          });
        }
        const participants = getEventData.participants.toString().split(",");
        participants.forEach((participant) => {
          const socket_room = `my_events/${participant}`;
          io.to(socket_room).emit("event_deleted", getEventData._id.toString());
        });
        io.to("feed").emit("event_deleted", getEventData._id.toString());
      }

      return response
        .status(200)
        .json(util.success(delEvent, "Event deleted successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "error deleting the event", error));
    }
  }

  async updateEvent(request, response) {
    try {
      let updateData = {};
      if (request.body.name) {
        updateData.name = request.body.name;
      }
      if (request.body.description) {
        updateData.description = request.body.description;
      }

      if (request.body.start_date && request.body.end_date) {
        const startDate = moment(
          request.body.start_date,
          "YYYY-MM-DDTHH:mm:ss",
          true
        );
        const endDate = moment(
          request.body.end_date,
          "YYYY-MM-DDTHH:mm:ss",
          true
        );

        if (startDate.isValid() && endDate.isValid()) {
          if (startDate.isAfter(endDate)) {
            return response
              .status(400)
              .json(util.error({}, "Start date must be before end date"));
          } else {
            updateData.start_date = startDate.toDate();
            updateData.end_date = endDate.toDate();
          }
        } else {
          console.error("Invalid date format");
        }
      }
      if (request.body.event_image) {
        updateData.event_image = request.body.event_image;
      }
      let newParticipants = [];
      if (
        request.body.participants &&
        Array.isArray(request.body.participants)
      ) {
        const event = await EventModel.getEvent(
          new ObjectId(request.body.event_id)
        );

        let participants = event.participants.map((participant) =>
          participant.toString()
        );

        request.body.participants.forEach((participant_id) => {
          if (
            ObjectId.isValid(participant_id) &&
            !participants.includes(participant_id)
          ) {
            participants.push(participant_id);
            newParticipants.push(participant_id);
          }
        });
        updateData.participants = participants.map(
          (participant_id) => new ObjectId(participant_id)
        );
      }

      if (
        request.body.removeParticipants &&
        request.body.removeParticipants.length > 0 &&
        Array.isArray(request.body.removeParticipants)
      ) {
        const event = await EventModel.getEvent(
          new ObjectId(request.body.event_id)
        );
        let participants = event.participants.map((participant) =>
          participant.toString()
        );

        request.body.removeParticipants.forEach((participant_id) => {
          participants = participants.filter(
            (participant) => participant !== participant_id
          );
        });

        updateData.participants = participants.map(
          (participant_id) => new ObjectId(participant_id)
        );
      }

      const result = await EventModel.updateEvent(
        { _id: new ObjectId(request.body.event_id) },
        updateData
      );
      const updatedEvent = await EventModel.getEventById(
        request.body.event_id,
        request.user._id
      );

      const user = await UserSchema.findOne(
        { _id: request.user._id },
        "user_name"
      );

      //send notification to new participant
      if (result && newParticipants.length > 0) {
        let newParticipantTokens = await FirebaseTokenModel.findByKey({
          user_id: { $in: newParticipants },
          is_deleted: false,
        });
        if (newParticipantTokens && newParticipantTokens.length > 0) {
          let notificationData = {
            tokens: newParticipantTokens.map(
              (tokenRecord) => tokenRecord.token
            ),
            title: `${result.name}`,
            body: `${user.user_name} added you to ${result.name}`,
            data: {
              type: "Participant Added",
              event_id: result._id.toString(),
            },
          };
          let notificationResult = await pushNotification.sendMulticast(
            notificationData
          );
        }
      }
      //send notification for updates to all participants
      if (result) {
        let participantTokens = await FirebaseTokenModel.findByKey({
          user_id: { $in: result.participants },
          is_deleted: false,
        });
        if (participantTokens && participantTokens.length > 0) {
          let notificationData = {
            tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
            title: `${result.name}`,
            body: `${user.user_name} updated ${result.name}`,
            data: {
              type: "Event Updated",
              event_id: result._id.toString(),
            },
          };
          let notificationResult = await pushNotification.sendMulticast(
            notificationData
          );
        }
      }
      const participants = result.participants.toString().split(",");
      participants.forEach((participant) => {
        const socket_room = `my_events/${participant}`;
        io.to(socket_room).emit("event_update", updatedEvent[0]);
      });

      return response
        .status(200)
        .json(util.success(result, "Event updated successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "error updating the event", error));
    }
  }

  async getUserEvents(request, response) {
    try {
      let whereClause = {
        participants: {
          $in: [request.user._id],
        },
      };
      const result = await EventModel.getUserEvents(whereClause);
      return response
        .status(200)
        .json(util.success(result, "User events fetched successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "Error fetching the user events", error));
    }
  }

  async getAllEvents(request, response) {
    try {
      const result = await EventModel.getAllEvents();
      return response
        .status(200)
        .json(util.success(result, "Events fetched successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "Error fetching the events", error));
    }
  }

  async getPublicEvents(request, response) {
    try {
      const events = await EventModel.getPublicEvents({}, request.user._id);

      const filteredEvents = events.filter(
        (event) =>
          event.memories &&
          event.memories[0] &&
          event.memories[0].memory_id !== undefined
      );

      return response
        .status(200)
        .json(util.success(filteredEvents, "Event fetched successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "Error fetching the events", error));
    }
  }

  async checkAndUpdateExpiredEvents() {
    try {
      const currentDate = new Date();
      const expiredEvents = await EventModel.getAllEvents({
        end_date: { $lt: currentDate },
        is_expired: false,
      });

      if (expiredEvents.length > 0) {
        for (const event of expiredEvents) {
          // Update the is_expired field to true
          await EventModel.updateEvent(
            { _id: event._id },
            { is_expired: true }
          );

          let participantTokens = await FirebaseTokenModel.findByKey({
            user_id: { $in: event.participants },
            is_deleted: false,
          });
          if (participantTokens && participantTokens.length > 0) {
            let notificationData = {
              tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
              title: `How was ${event.name}?`,
              body: `Take a moment to relive the highlights and download your favorites memories.`,
              data: {
                type: "Event Terminated",
                event_id: event._id.toString(),
              },
            };
            let notificationResult = await pushNotification.sendMulticast(
              notificationData
            );
            let insObject = [];
            insObject.push({
              user_id: event.participants[0],
              receiver_id: event.participants,
              title: notificationData.title,
              message: notificationData.body,
              data_message: notificationData.data,
              is_read: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            let addNotification =
              await NotificationModel.createManyNotifications(insObject);

            event.participants.forEach((participant) => {
              io.to(participant.toString()).emit("new_notification", {});
            });
          }
        }
      }
    } catch (error) {
      throw error;
    }
  }

  async createPrompt(request, response) {
    try {
      if (request.body.prompt) {
        const event = await EventSchema.findById(request.body.event_id);
        if (!event) {
          console.error("Event not found");
          return response.status(404).json({ error: "Event not found" });
        }
        const existingPrompt = event.prompts.find(
          (p) => p.name === request.body.prompt.name
        );
        if (!existingPrompt) {
          const updatedEvent = await EventSchema.findByIdAndUpdate(
            request.body.event_id,
            {
              $push: {
                prompts: request.body.prompt,
              },
            },
            { new: true }
          );
          if (updatedEvent) {
            console.log("Prompt added successfully");
            //send prompt with socket
            const user = await UserSchema.findOne(
              { _id: request.user._id },
              "user_name"
            );
            if (event) {
              let filteredParticipants = event.participants.filter(
                (participantId) =>
                  participantId.toString() !== request.user._id.toString()
              );
              let participantTokens = await FirebaseTokenModel.findByKey({
                user_id: { $in: filteredParticipants },
                is_deleted: false,
              });
              if (participantTokens && participantTokens.length > 0) {
                let notificationData = {
                  tokens: participantTokens.map(
                    (tokenRecord) => tokenRecord.token
                  ),
                  title: `${user.user_name} in ${event.name}`,
                  body: `${request.body.prompt.name}`,
                  url: `/event/${event._id.toString()}`,
                  data: {
                    type: "Prompt Creation",
                    event_id: event._id.toString(),
                  },
                };
                let notificationResult = await pushNotification.sendMulticast(
                  notificationData
                );
              }
              const socket_room = `event/${event._id}`;
              io.to(socket_room.toString()).emit(
                "new_prompt",
                request.body.prompt
              );
            }
            return response.status(200).json({
              message: "Prompt added successfully",
              event: updatedEvent,
            });
          } else {
            console.error("Error updating event");
            return response.status(500).json({ error: "Error updating event" });
          }
        } else {
          console.log("Prompt already exists");
          return response
            .status(409)
            .json({ message: "Prompt already exists" });
        }
      }
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "error creating the prompt", error));
    }
  }

  async deletePrompt(request, response) {
    try {
      if (!request.body.event_id || !request.body.prompt_id) {
        return response
          .status(400)
          .json({ error: "Event ID and Prompt ID must be provided" });
      }

      const eventId = request.body.event_id;
      const promptId = request.body.prompt_id;

      const event = await EventSchema.findById(eventId);
      if (!event) {
        console.error("Event not found");
        return response.status(404).json({ error: "Event not found" });
      }

      // Convert promptId from string to ObjectId before the comparison
      const promptObjectId = new ObjectId(promptId);
      const existingPrompt = event.prompts.find((p) =>
        p._id.equals(promptObjectId)
      );

      if (!existingPrompt) {
        console.log("Prompt does not exist");
        return response.status(404).json({ message: "Prompt not found" });
      }

      const updatedEvent = await EventSchema.findByIdAndUpdate(
        eventId,
        { $pull: { prompts: { _id: promptObjectId } } },
        { new: true }
      );

      if (updatedEvent) {
        console.log("Prompt deleted successfully");
        return response.status(200).json({
          message: "Prompt deleted successfully",
          event: updatedEvent,
        });
      } else {
        console.error("Error updating event");
        return response.status(500).json({ error: "Error updating event" });
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
      return response
        .status(500)
        .json({ error: "Internal server error", details: error.toString() });
    }
  }

  async addParticipant(request, response) {
    try {
      if (!request.body.eventId) {
        return response
          .status(400)
          .json({ error: "Event ID is required to perform this action" });
      }

      const eventId = request.body.eventId;
      const userId = request.user._id;

      const event = await EventModel.getEventById(eventId, userId);

      const updatedEvent = await EventSchema.findByIdAndUpdate(
        eventId,
        // avoid adding the same user multiple times
        { $addToSet: { participants: userId } },
        // Return the modified document
        { new: true }
      );

      if (!updatedEvent) {
        return response.status(404).json({ error: "Event not found" });
      }
      const user = await UserSchema.findOne(
        { _id: request.user._id },
        "user_name"
      );
      if (event && user && updatedEvent) {
        let filteredParticipants = updatedEvent.participants
          .filter((participant) => participant.toString() != userId)
          .map((participant) => participant.toString());

        let participantsTokens = await FirebaseTokenModel.findByKey({
          user_id: { $in: filteredParticipants },
          is_deleted: false,
        });
        if (participantsTokens && participantsTokens.length > 0) {
          let notificationData = {
            tokens: participantsTokens.map((tokenRecord) => tokenRecord.token),
            title: `${updatedEvent.name}`,
            body: `${user.user_name} joined ${updatedEvent.name}`,
            data: {
              type: "Participant Added",
              event_id: updatedEvent._id.toString(),
            },
          };
          let notificationResult = await pushNotification.sendMulticast(
            notificationData
          );
        }
      }
      const participants = updatedEvent.participants.toString().split(",");
      participants.forEach((participant) => {
        const socket_room = `my_events/${participant}`;
        io.to(socket_room).emit("event_update", updatedEvent);
      });
      // Send the updated event as the response
      return response
        .status(200)
        .json(util.success(updatedEvent, "User successfully added"));
    } catch (error) {
      console.error("Something went wrong adding participant", error);
      return response
        .status(500)
        .json({ error: "Internal server error", details: error.toString() });
    }
  }

  //memory related functions
  async createMemory(request, response) {
    try {
      let insObj = {};
      insObj.created_by = new ObjectId(request.user._id);

      if (request.body.event_id && ObjectId.isValid(request.body.event_id)) {
        insObj.event_id = new ObjectId(request.body.event_id);
      } else {
        return response
          .status(400)
          .json(util.error({}, "Enter a valid event id"));
      }

      if (request.body.memory_file) {
        insObj.media_file = request.body.memory_file;
      }

      if (!request.body.type) {
        return response.status(400).json(util.error({}, "|Type is required"));
      } else {
        insObj.type = request.body.type;
      }
      if (request.body.caption && request.body.caption.trim() !== "") {
        insObj.caption = request.body.caption;
      }

      const memory = await EventModel.createMemory(insObj);
      const event = await EventModel.getEvent(memory.event_id);
      const user = await UserSchema.findOne(
        { _id: request.user._id },
        "user_name"
      );
      // if memory contains prompt_id
      if (request.body.prompt_name) {
        const updatedEvent = await EventSchema.findByIdAndUpdate(
          request.body.event_id,
          {
            $push: {
              "prompts.$[elem].memories_id": memory._id,
            },
          },
          {
            new: true,
            arrayFilters: [{ "elem.name": request.body.prompt_name }],
          }
        );
        if (updatedEvent) {
          const socket_room = `event/${memory.event_id}`;
          const data = {
            memory_id: memory._id,
            prompt_name: request.body.prompt_name,
          };
          io.to(socket_room.toString()).emit("new_memory_prompt", data);
        }
      }

      if (event) {
        let filteredParticipants = event.participants.filter(
          (participantId) =>
            participantId.toString() !== request.user._id.toString()
        );
        let participantTokens = await FirebaseTokenModel.findByKey({
          user_id: { $in: filteredParticipants },
          is_deleted: false,
        });
        if (participantTokens && participantTokens.length > 0) {
          let notificationData = {
            tokens: participantTokens.map((tokenRecord) => tokenRecord.token),
            title: `${event.name}`,
            // body: `${user.user_name} shared a new memory`,
            body: `${user.user_name} ${
              request.body.prompt_name
                ? `replied to ${request.body.prompt_name}`
                : `shared a new memory`
            }`,
            url: `/event/${event._id.toString()}`,
            memory_id: memory._id.toString(),
            data: {
              type: "Memory Creation",
              event_id: event._id.toString(),
            },
          };
          let notificationResult = await pushNotification.sendMulticast(
            notificationData
          );
        }
      }

      const eventWithMemories = await EventModel.getEventWithMemories(
        {
          _id: memory.event_id,
        },
        request.user._id
      );

      if (eventWithMemories[0].memories.length === 1) {
        if (event.event_visibility !== "private") {
          io.to("feed").emit("new_event_with_memory", {
            eventWithMemories,
          });
        }

        const socket_room = `event/${memory.event_id}`;
        io.to(socket_room.toString()).emit("new_memory", memory);
      } else {
        const socket_room = `event/${memory.event_id}`;
        io.to(socket_room.toString()).emit("new_memory", memory);
        if (event.event_visibility !== "private") {
          io.to("feed").emit("new_memory_feed", memory);
        }
      }

      return response
        .status(200)
        .json(util.success(memory, "Memory created successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, error.message || "Memory creation failed"));
    }
  }

  async deleteMemory(request, response) {
    try {
      let memories_ids = [];
      if (
        request.body.memories_ids &&
        Array.isArray(request.body.memories_ids)
      ) {
        request.body.memories_ids.forEach((id) => {
          if (ObjectId.isValid(id)) {
            memories_ids.push(new ObjectId(id));
          }
        });
      } else {
        return response
          .status(500)
          .json(util.error({}, "Enter a valid memory ids Array"));
      }
      //fetching all memories before deleting
      const memories = await MemorySchema.find({
        _id: { $in: memories_ids },
      });

      for (const memory of memories) {
        if (
          memory.media_file &&
          memory.media_file.indexOf(process.env.CLOUD_FRONT_URL) > -1
        ) {
          const awsKey = memory.media_file.replace(
            process.env.CLOUD_FRONT_URL,
            ""
          );
          await uploadHelper.deleteFile(awsKey);
        }
      }

      //deleting memories from db
      let deleteMemories = await EventModel.deleteMemories({
        _id: {
          $in: memories_ids,
        },
      });
      const event_id = memories[0].event_id;
      const memories_ids_str = memories.map((memory) => memory._id.toString());
      const socket_room = `event/${event_id}`;
      io.to(socket_room.toString()).emit("memory_deleted", memories_ids_str);
      io.to("feed").emit(
        "memory_deleted",
        event_id.toString(),
        memories_ids_str
      );
      return response
        .status(200)
        .json(util.success({}, "Memories deleted successfully"));
    } catch (error) {
      return response
        .status(400)
        .json(util.error({}, "error deleting the memories", error));
    }
  }

  async likeUnlikeMemory(request, response) {
    try {
      if (
        !request.body.memory_id ||
        typeof request.body.memory_id == "undefined" ||
        (request.body.memory_id && !ObjectId.isValid(request.body.memory_id))
      ) {
        return response
          .status(400)
          .json(util.error({}, "Memory ID is required"));
      } else if (
        typeof request.body.type === "undefined" ||
        request.body.type == "" ||
        !CONSTANTS.LIKE_TYPES.includes(request.body.type)
      ) {
        return response
          .status(400)
          .json(util.error({}, "Vote type is required"));
      } else {
        let memoryWhere = { _id: new ObjectId(request.body.memory_id) };

        const memoryExists = (await EventModel.countMemory(memoryWhere)) > 0;
        if (!memoryExists) {
          return response
            .status(400)
            .json(util.error({}, "Memory does not exist"));
        }

        let reactionWhere = {
          reaction_by: request.user._id,
          memory_id: new ObjectId(request.body.memory_id),
          is_deleted: false,
        };

        let existingReaction = await LikesModel.findOne(reactionWhere);
        let resVote = {};
        let memoryData = await MemorySchema.findOne(memoryWhere);
        if (existingReaction) {
          if (existingReaction.type === request.body.type) {
            // If reaction exists and type matches, remove it.
            await LikesModel.hardDelete(reactionWhere);
            resVote = { removed: true };
            const data = {
              type: request.body.type,
              memory_id: memoryData._id.toString(),
            };
            io.to(`event/${memoryData.event_id}`).emit(
              "reaction_removed",
              data
            );
          } else {
            // If reaction exists but type differs, update it.
            const previousType = existingReaction.type;
            await LikesModel.updateOne(reactionWhere, {
              type: request.body.type,
            });
            resVote = { updated: true, type: request.body.type };
            const data = {
              previousType: previousType,
              type: request.body.type,
              memory_id: memoryData._id.toString(),
            };
            io.to(`event/${memoryData.event_id}`).emit(
              "reaction_updated",
              data
            );
            io.to(memoryData.created_by._id.toString()).emit(
              "new_notification",
              {}
            );
            //notify users
            await notifySingleUserInEvent(
              memoryData.event_id,
              memoryData._id,
              memoryData.created_by,
              request.user._id,
              io
            );
          }
        } else {
          // No reaction exists, add a new one.
          let addReaction = await LikesModel.createLike({
            reaction_by: request.user._id,
            memory_id: new ObjectId(request.body.memory_id),
            type: request.body.type,
          });
          resVote = { added: true, data: addReaction };
          const data = {
            type: request.body.type,
            memory_id: memoryData._id.toString(),
          };
          io.to(`event/${memoryData.event_id}`).emit("new_reaction", data);
          io.to(memoryData.created_by._id.toString()).emit(
            "new_notification",
            {}
          );

          await notifySingleUserInEvent(
            memoryData.event_id,
            memoryData._id,
            memoryData.created_by,
            request.user._id,
            io
          );
        }
        return response
          .status(200)
          .json(util.success(resVote, "Reaction updated successfully"));
      }
    } catch (error) {
      console.log(error, "error");
      return response
        .status(400)
        .json(util.error({}, error.message || "Failed to process reaction"));
    }
  }

  async getMemoryById(request, response) {
    try {
      const memoryId = request.params.memory_id;
      const memory = await EventModel.getMemoryById(memoryId, request.user._id);

      return response
        .status(200)
        .json(util.success(memory, "Memory fetched successfully"));
    } catch (error) {
      response
        .status(400)
        .json(util.error({}, "error fetching the memory", error));
    }
  }
}

module.exports = new EventHandler();
