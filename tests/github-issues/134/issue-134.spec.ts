import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../test/utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";

describe("github issues > #134 Error TIME is converted to 'HH-mm' instead of 'HH:mm", () => {

    let connections: Connection[];
    beforeAll(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb", "sqlite", "mssql", "postgres"] // Oracle does not support TIME data type.
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    afterAll(() => closeTestingConnections(connections));


    test("should successfully persist the post with creationDate in HH:mm and return persisted entity", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const post = new Post();
        const currentDate = new Date();
        post.title = "Hello Post #1";
        post.creationDate = currentDate;

        const savedPost = await postRepository.save(post);
        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .where("post.id=:id", { id: savedPost.id })
            .getOne();

        // create a correct minutes:hours:seconds string
        let hours = String(currentDate.getHours());
        let minutes = String(currentDate.getMinutes());
        let seconds = String(currentDate.getSeconds());
        hours = hours.length === 1 ? "0" + hours : hours;
        minutes = minutes.length === 1 ? "0" + minutes : minutes;
        seconds = seconds.length === 1 ? "0" + seconds : seconds;

        expect(loadedPost).not.toBeUndefined();
        expect(loadedPost!.creationDate).toEqual(hours + ":" + minutes + ":" + seconds);

    })));

});