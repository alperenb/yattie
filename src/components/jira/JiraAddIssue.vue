<template>
  <v-list-item @click="showDialog()">
    <v-list-item-icon class="mr-4">
      <v-avatar size="24">
        <img
          :src="require('../../assets/icon/jira.png')"
          width="24"
          alt="avatar"
        />
      </v-avatar>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>{{ $tc("caption.jira", 1) }}</v-list-item-title>
    </v-list-item-content>

    <v-dialog v-model="dialog" persistent width="450">
      <v-sheet outlined color="accent" rounded>
        <v-card>
          <v-card-title
            class="dialog-title"
            :style="{ color: currentTheme.secondary }"
          >
            {{ $tc("caption.create_new_jira_issue", 1) }}
          </v-card-title>
          <v-divider></v-divider>
          <div class="pa-2">
            <v-row>
              <v-col cols="12">
                <div class="loading-wrapper" v-if="loading">
                  <v-progress-circular
                    :size="70"
                    :width="7"
                    color="primary"
                    indeterminate
                  ></v-progress-circular>
                </div>
                <div class="issue-wrapper" v-else>
                  <v-form lazy-validation v-model="valid" ref="form">
                    <v-container v-if="projects.length > 0">
                      <v-row>
                        <v-col cols="6">
                          <v-select
                            v-model="projectId"
                            :items="projects"
                            class="project-select"
                            :label="$tc('caption.select_project', 1)"
                            item-text="name"
                            item-value="id"
                            hide-details="true"
                            @change="handleProject"
                          >
                            <template v-slot:selection="{ attr, on, item }">
                              <div class="project-item" v-bind="attr" v-on="on">
                                <v-avatar size="20">
                                  <img
                                    :src="item.avatarUrls['24x24']"
                                    width="24"
                                    alt="avatar"
                                  />
                                </v-avatar>
                                {{ item.name }}
                              </div>
                            </template>
                            <template v-slot:item="{ item }">
                              <div class="project-item">
                                <v-avatar size="24">
                                  <img
                                    :src="item.avatarUrls['24x24']"
                                    width="24"
                                    alt="avatar"
                                  />
                                </v-avatar>
                                {{ item.name }}
                              </div>
                            </template>
                          </v-select>
                        </v-col>
                        <v-col cols="6" v-if="project">
                          <v-select
                            v-model="issueTypeId"
                            :items="project.issueTypes"
                            :label="$tc('caption.select_issue_type', 1)"
                            item-text="name"
                            item-value="id"
                            hide-details="true"
                            @change="handleIssueType"
                          >
                            <template v-slot:selection="{ attr, on, item }">
                              <div
                                class="issue-item"
                                v-bind="attr"
                                v-on="on"
                                :style="{ color: currentTheme.secondary }"
                              >
                                <v-avatar size="20">
                                  <img
                                    :src="item.iconUrl"
                                    width="24"
                                    alt="avatar"
                                  />
                                </v-avatar>
                                {{ item.name }}
                              </div>
                            </template>
                            <template v-slot:item="{ item }">
                              <div
                                class="issue-item"
                                :style="{ color: currentTheme.secondary }"
                              >
                                <v-avatar size="24">
                                  <img
                                    :src="item.iconUrl"
                                    width="24"
                                    alt="avatar"
                                  />
                                </v-avatar>
                                {{ item.name }}
                              </div>
                            </template>
                          </v-select>
                        </v-col>
                      </v-row>
                      <v-row
                        v-if="issueTypeId !== null && issueFields !== null"
                      >
                        <v-col cols="12">
                          <template v-for="item in issueFields">
                            <div
                              class="field-item mb-2"
                              :key="item.key"
                              v-if="
                                item.key !== 'issuetype' &&
                                item.key !== 'project'
                              "
                            >
                              <div
                                v-if="
                                  fieldMappings?.[item.key]?.type === 'text'
                                "
                              >
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-tiptap
                                  v-model="newIssue.fields[item.key]"
                                  :dark="$vuetify.theme.dark"
                                  :light="!$vuetify.theme.dark"
                                  :vuetify="$vuetify"
                                  :placeholder="$t('message.insert_note')"
                                  ref="newIssue.fields[item.key]"
                                  :toolbar="[
                                    'headings',
                                    '|',
                                    'bold',
                                    'italic',
                                    'underline',
                                    '|',
                                    'color',
                                    '|',
                                    'bulletList',
                                    'orderedList',
                                    '|',
                                    'link',
                                    'emoji',
                                    'blockquote',
                                  ]"
                                >
                                </v-tiptap>
                              </div>
                              <div v-else-if="item.schema.type === 'string'">
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-text-field
                                  outlined
                                  dense
                                  :height="35"
                                  v-model="newIssue.fields[item.key]"
                                  :required="item.required"
                                  :rules="item.required ? rules : []"
                                ></v-text-field>
                              </div>
                              <div v-else-if="item.schema.type === 'number'">
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-text-field
                                  outlined
                                  dense
                                  :height="35"
                                  type="number"
                                  v-model="newIssue.fields[item.key]"
                                  :required="item.required"
                                  :rules="item.required ? rules : []"
                                ></v-text-field>
                              </div>
                              <div v-else-if="item.schema.type === 'option'">
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-select
                                  dense
                                  outlined
                                  placeholder="Select a Item"
                                  :items="item.allowedValues"
                                  item-value="id"
                                  item-text="value"
                                  v-model="newIssue.fields[item.key]"
                                  :required="item.required"
                                  :rules="item.required ? rules : []"
                                ></v-select>
                              </div>
                              <div
                                v-else-if="
                                  item.schema.type === 'array' &&
                                  item.schema.system !== 'issuelinks' &&
                                  item.schema.system !== 'labels' &&
                                  item.schema.system !== 'attachment'
                                "
                              >
                                <!-- TODO - add autocomplete & labels support -->
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-row class="mx-1 mb-1" justify="start">
                                  <v-checkbox
                                    v-for="(
                                      arrayItem, index
                                    ) in item.allowedValues"
                                    :key="index"
                                    light
                                    :label="arrayItem.value"
                                    class="mr-3"
                                    color="primary"
                                    v-model="newIssue.fields[item.key].selected"
                                    :dark="$vuetify.theme.dark"
                                  >
                                  </v-checkbox>
                                </v-row>
                              </div>
                              <div
                                v-else-if="
                                  item.schema.type === 'user' &&
                                  item.key !== 'reporter'
                                "
                              >
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-autocomplete
                                  outlined
                                  dense
                                  clearable
                                  :height="35"
                                  :loading="userLoading"
                                  :items="users"
                                  item-text="displayName"
                                  item-value="accountId"
                                  :required="item.required"
                                  :rules="item.required ? rules : []"
                                  v-model="newIssue.fields[item.key].id"
                                  @focus="searchUser(item.autoCompleteUrl)"
                                >
                                  <template
                                    v-slot:selection="{ attr, on, item }"
                                  >
                                    <div
                                      class="user-item"
                                      v-bind="attr"
                                      v-on="on"
                                    >
                                      <v-avatar size="20">
                                        <img
                                          :src="item.avatarUrls['24x24']"
                                          width="24"
                                          alt="avatar"
                                        />
                                      </v-avatar>
                                      {{ item.displayName }}
                                    </div>
                                  </template>
                                  <template v-slot:item="{ item }">
                                    <div class="user-item">
                                      <v-avatar size="24">
                                        <img
                                          :src="item.avatarUrls['24x24']"
                                          width="24"
                                          alt="avatar"
                                        />
                                      </v-avatar>
                                      {{ item.displayName }}
                                    </div>
                                  </template>
                                </v-autocomplete>
                              </div>
                              <div v-else-if="item.schema.type === 'issuelink'">
                                <div
                                  class="subtitle-2 label-text"
                                  :style="{ color: currentTheme.secondary }"
                                >
                                  {{ item.name }}
                                </div>
                                <v-autocomplete
                                  outlined
                                  dense
                                  clearable
                                  :height="35"
                                  :loading="issueLoading"
                                  :items="issues"
                                  item-text="key"
                                  item-value="id"
                                  :required="item.required"
                                  :rules="item.required ? rules : []"
                                  v-model="newIssue.fields[item.key].id"
                                  @focus="searchIssue"
                                >
                                </v-autocomplete>
                              </div>
                            </div>
                          </template>
                        </v-col>
                      </v-row>
                    </v-container>
                  </v-form>
                </div>
              </v-col>
            </v-row>
          </div>
          <v-divider></v-divider>
          <v-card-actions>
            <v-row class="action-wrapper">
              <v-col cols="6 pr-1">
                <v-btn
                  class="btn"
                  small
                  block
                  color="white"
                  :style="{ color: currentTheme.black }"
                  :disabled="loading"
                  @click="handleDiscard()"
                >
                  {{ $tc("caption.discard", 1) }}
                </v-btn>
              </v-col>
              <v-col cols="6 pl-1">
                <v-btn
                  class="btn"
                  small
                  block
                  color="primary"
                  :disabled="loading"
                  @click="handleSave()"
                >
                  {{ $tc("caption.export", 1) }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-card>
      </v-sheet>
    </v-dialog>
    <v-snackbar v-model="snackBar.enabled" timeout="3000">
      {{ snackBar.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="snackBar.enabled = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-list-item>
</template>

<script>
import jiraIntegrationHelper from "../../integrations/JiraIntegrationHelpers";

export default {
  name: "JiraAddIssue",
  props: {
    credentialItems: {
      type: Array,
      default: () => [],
    },
    items: {
      type: Array,
      default: () => [],
    },
    selected: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    credentialItems: function (newValue) {
      this.credentials = newValue;
    },
    items: function (newValue) {
      this.itemLists = newValue;
    },
    selected: function (newValue) {
      this.selectedIds = newValue;
    },
  },
  data() {
    return {
      credentials: this.credentialItems,
      itemLists: this.items,
      selectedIds: this.selected ? this.selected : [],
      dialog: false,
      loading: false,
      userLoading: false,
      issueLoading: false,
      projects: [],
      project: null,
      projectId: null,
      issueTypeId: null,
      issueFields: [],
      users: null,
      issues: null,
      newIssue: {
        fields: {},
      },
      valid: true,
      rules: [(v) => !!v || "This field is required"],
      dateMenu: false,
      issueConfirmDialog: false,
      snackBar: {
        enabled: false,
        message: "",
      },
      fieldMappings: {
        description: {
          type: "text",
        },
      },
    };
  },
  computed: {
    currentTheme() {
      if (this.$vuetify.theme.dark) {
        return this.$vuetify.theme.themes.dark;
      } else {
        return this.$vuetify.theme.themes.light;
      }
    },
  },
  mounted() {},
  destroyed() {
    this.handleClear();
  },
  methods: {
    handleDiscard() {
      this.handleClear();
      this.dialog = false;
    },
    handleClear(leaveProject = true) {
      if (!leaveProject) {
        this.project = null;
        this.projectId = null;
      }
      this.issueTypeId = null;
      this.issueFields = [];
      this.newIssue = {
        fields: {},
      };
    },
    async handleSave() {
      const isValid = this.$refs.form.validate();
      if (isValid) {
        const project = {
          id: this.projectId,
        };
        const issueType = {
          id: this.issueTypeId,
        };
        this.$set(this.newIssue.fields, "project", project);
        this.$set(this.newIssue.fields, "issuetype", issueType);
        this.loading = true;

        let response = await jiraIntegrationHelper.createIssue(
          this.credentials[this.project.credentialIndex],
          this.newIssue,
          this.fieldMappings
        );
        if (response?.error) {
          this.loading = false;
          this.snackBar.enabled = true;
          this.snackBar.message = response.error.message
            ? response.error.message
            : this.$tc("message.api_error", 1);
          if (response.error?.checkAuth) {
            this.$root.$emit("update-auth", []);
          }
        } else {
          let selectedAttachments = [];
          if (this.selectedIds.length > 0) {
            this.itemLists.map((item) => {
              if (
                item.sessionType !== "Summary" &&
                this.selectedIds.includes(item.id)
              ) {
                selectedAttachments.push(item);
              }
            });
          }

          let attachmentResponse;
          if (selectedAttachments.length > 0) {
            attachmentResponse = await jiraIntegrationHelper.createAttachments(
              this.credentials[this.project.credentialIndex],
              response.data,
              selectedAttachments
            );
          }
          this.loading = false;
          if (attachmentResponse?.error) {
            let message =
              "Unable to create attachment for issue " +
              response.data.key +
              " " +
              (attachmentResponse.error.message
                ? attachmentResponse.error.message
                : "") +
              " " +
              this.$tc("message.please_try_again", 1);
            this.$root.$emit("set-snackbar", message);
            if (attachmentResponse.error?.checkAuth) {
              this.$root.$emit("update-auth", []);
            }
          } else {
            this.handleClear();
            this.dialog = false;
            this.$root.$emit(
              "set-snackbar",
              this.$tc("message.successfully_created_issue", 1)
            );
          }
        }
      } else {
        this.snackBar.enabled = true;
        this.snackBar.message = this.$tc("message.please_fill_required", 1);
      }
    },
    async showDialog() {
      this.$emit("close-menu");
      this.dialog = true;
      this.loading = true;
      let response = await jiraIntegrationHelper.getAllProjects(
        this.credentials
      );

      this.projects = response.projects;
      this.loading = false;
      if (response?.error) {
        this.dialog = false;
        let message = response.error.message
          ? response.error.message
          : this.$tc("message.api_error", 1);
        message += " " + this.$tc("message.please_try_again", 1);
        this.$root.$emit("set-snackbar", message);
        if (response.error?.checkAuth) {
          this.$root.$emit("update-auth", []);
        }
      }
    },
    async handleProject() {
      this.loading = true;
      let foundProject = this.projects.find(
        (project) => project.id === this.projectId
      );

      let response = await jiraIntegrationHelper.getProject(
        this.credentials[foundProject.credentialIndex],
        this.projectId
      );
      response.project.credentialIndex = foundProject.credentialIndex;
      this.project = response.project;

      this.loading = false;
      if (response?.error) {
        this.snackBar.enabled = true;
        this.snackBar.message = response.error.message
          ? response.error.message
          : this.$tc("message.api_error", 1);
        if (response.error?.checkAuth) {
          this.$root.$emit("update-auth", []);
        }
      }
    },
    async handleIssueType() {
      this.loading = true;
      let response = await jiraIntegrationHelper.getIssueTypeData(
        this.credentials[this.project.credentialIndex],
        this.projectId,
        this.issueTypeId
      );
      this.newIssue = response.blankIssue;
      this.issueFields = response.fieldData;

      this.loading = false;
      if (response?.error) {
        this.snackBar.enabled = true;
        this.snackBar.message = response.error.message
          ? response.error.message
          : this.$tc("message.api_error", 1);
        if (response.error?.checkAuth) {
          this.$root.$emit("update-auth", []);
        }
      }
    },
    async searchUser(url) {
      this.userLoading = true;
      let response = await jiraIntegrationHelper.getProvidedURL(
        this.credentials[this.project.credentialIndex],
        url
      );
      this.users = response.items;

      this.userLoading = false;
      if (response?.error) {
        this.snackBar.enabled = true;
        this.snackBar.message = response.error.message
          ? response.error.message
          : this.$tc("message.api_error", 1);
        if (response.error?.checkAuth) {
          this.$root.$emit("update-auth", []);
        }
      }
    },
    async searchIssue() {
      this.issueLoading = true;
      let response = await jiraIntegrationHelper.searchIssues(
        this.credentials[this.project.credentialIndex],
        { project: this.projectId }
      );
      this.issues = response.issues;

      this.issueLoading = false;
      if (response?.error) {
        this.snackBar.enabled = true;
        this.snackBar.message = response.error.message
          ? response.error.message
          : this.$tc("message.api_error", 1);
        if (response.error?.checkAuth) {
          this.$root.$emit("update-auth", []);
        }
      }
    },
    updateDescription({ content, text }) {
      this.description.content = content;
      this.description.text = text;
    },
  },
};
</script>
<style scoped>
.dialog-title {
  /* border-bottom: 1px solid #e5e7eb; */
  font-size: 14px;
  font-style: normal;
  font-weight: 600;
  line-height: 20px;
  color: #111827;
  padding: 12px;
}
.dialog-content {
  max-height: 300px;
  overflow-y: auto;
}
.v-card__actions {
  padding: 12px;
}
.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 300px;
}
.issue-wrapper {
  min-height: 300px;
  max-height: 300px;
  overflow-y: auto;
}
.project-item,
.issue-item,
.user-item {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  column-gap: 5px;
}
</style>
